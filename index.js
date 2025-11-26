// =====================
// Honduras News Bot 🇭🇳
// Estable y seguro
// =====================

import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
} from "discord.js";

import Parser from "rss-parser";
import 'dotenv/config'; // Lee .env
import fetch from "node-fetch";

// =====================
// Manejo global de errores
// =====================
process.on("unhandledRejection", (err) => {
    console.error("Unhandled promise rejection:", err);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});
process.on("error", (err) => {
    console.error("Error global:", err);
});

// =====================
// Crear cliente Discord
// =====================
const bot = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Manejar errores del cliente
bot.on("error", (err) => {
    console.error("Error en cliente Discord:", err);
});

// =====================
// TOKEN
// =====================
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error("❌ ERROR: No se encontró TOKEN en .env");
    process.exit(1);
}

// =====================
// RSS Feeds
// =====================
const rss = new Parser({
    requestOptions: {
        timeout: 10000,
        headers: { 'User-Agent': 'BotHN/1.0' }
    }
});

const FEEDS = {
    nacionales: [
        "https://www.laprensa.hn/rss/honduras",
        "https://www.elheraldo.hn/rss/honduras"
    ],
    internacionales: [
        "https://www.laprensa.hn/rss/mundo",
        "https://www.elheraldo.hn/rss/mundo"
    ],
    tech: [
        "https://www.xataka.com/tag/honduras/rss"
    ]
};

// =====================
// Función segura para parsear feeds
// =====================
async function safeParse(url) {
    try {
        const data = await rss.parseURL(url);
        return data.items.slice(0, 3);
    } catch (err) {
        console.warn(`⚠ No se pudo parsear el feed ${url}:`, err.message);
        return []; // Devuelve vacío y sigue con los demás
    }
}

// =====================
// Slash command /noticias
// =====================
const command = new SlashCommandBuilder()
    .setName("noticias")
    .setDescription("Ver noticias recientes de Honduras")
    .addStringOption(opt =>
        opt.setName("tipo")
        .setDescription("Selecciona el tipo de noticia")
        .setRequired(true)
        .addChoices(
            { name: "Nacionales", value: "nacionales" },
            { name: "Internacionales", value: "internacionales" },
            { name: "Tecnología/Gaming", value: "tech" }
        )
    );

// =====================
// Registrar comando
// =====================
bot.once("ready", async () => {
    console.log(`Bot conectado como ➤ ${bot.user.tag} 🇭🇳`);

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(bot.user.id),
            { body: [command.toJSON()] }
        );
        console.log("Slash commands registrados ✔");
    } catch(e) {
        console.error("Error registrando comandos:", e);
    }
});

// =====================
// Manejar interacción
// =====================
bot.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "noticias") return;

    const tipo = interaction.options.getString("tipo");
    const urls = FEEDS[tipo];

    await interaction.deferReply();

    let noticias = [];
    for (let url of urls) {
        const items = await safeParse(url);
        noticias.push(...items);
    }

    if (noticias.length === 0) {
        return interaction.editReply("⚠️ No se pudieron cargar noticias. Intenta más tarde.");
    }

    const embed = new EmbedBuilder()
        .setTitle(`📰 Noticias: ${tipo.toUpperCase()}`)
        .setColor("#0b6bff")
        .setFooter({ text: "Fuente: Medios Hondureños" })
        .setTimestamp();

    noticias.forEach(n => embed.addFields({ name: n.title, value: n.link }));

    interaction.editReply({ embeds: [embed] });
});

// =====================
// LOGIN
// =====================
bot.login(TOKEN);
