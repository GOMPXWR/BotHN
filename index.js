// =====================
// Honduras News Bot 🇭🇳
// Con soporte .env y manejo de errores
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
import 'dotenv/config'; // Lee el .env

// =====================
// Manejo global de errores
// =====================
process.on("unhandledRejection", (err) => {
    console.error("Unhandled promise rejection:", err);
});

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error("❌ ERROR: No se encontró TOKEN en .env");
    process.exit(1);
}

// ======================
//  RSS Feeds del Bot
// ======================
const rss = new Parser();

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

// ========================================
// Crear cliente del bot
// ========================================
const bot = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ==================================
// Slash command /noticias
// ==================================
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

// ==============================
// Registrar comandos al iniciar
// ==============================
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
// Evento interacción
// =====================
bot.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "noticias") return;

    const tipo = interaction.options.getString("tipo");
    const urls = FEEDS[tipo];

    await interaction.deferReply();

    let noticias = [];

    for (let url of urls) {
        try {
            const data = await rss.parseURL(url);
            noticias.push(...data.items.slice(0, 3));
        } catch (err) {
            console.error(`❌ Error al leer RSS ${url}:`, err.message);
        }
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
