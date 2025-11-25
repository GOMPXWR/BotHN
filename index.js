

import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
} from "discord.js";

import Parser from "rss-parser";
import "dotenv/config"; // Requiere TOKEN en Railway .env


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


const bot = new Client({
    intents: [GatewayIntentBits.Guilds]
});


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


bot.once("ready", async () => {
    console.log(`Bot conectado como ➤ ${bot.user.tag} 🇭🇳`);

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(bot.user.id),
            { body: [command.toJSON()] }
        );

        console.log("Slash commands registrados globalmente ✔");
    } catch(e) {
        console.error("Error registrando comandos:", e);
    }
});


bot.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "noticias") return;

    const tipo = interaction.options.getString("tipo");
    const urls = FEEDS[tipo];

    await interaction.deferReply(); // por si tarda el fetch

    let noticias = [];

    for (let url of urls) {
        const data = await rss.parseURL(url);
        noticias.push(...data.items.slice(0, 3)); // 3 noticias recientes
    }

    const embed = new EmbedBuilder()
        .setTitle(`📰 Noticias: ${tipo.toUpperCase()}`)
        .setColor("#0b6bff")
        .setFooter({ text: "Fuente: Medios Hondureños" })
        .setTimestamp();

    noticias.forEach(n => embed.addFields({ name: n.title, value: n.link }));

    interaction.editReply({ embeds: [embed] });
});


bot.login(process.env.TOKEN);
