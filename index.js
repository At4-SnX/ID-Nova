require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const createId = require("./commands/createId");
const getId = require("./commands/getId");
const deleteId = require("./commands/deleteId");

// Mots déclencheurs (pas de commandes slash "/" pour ce bot)
const CMD_CREATE = "nova.id";
const CMD_GET = "nova.getid";
const CMD_DELETE = "nova.delid";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("clientReady", () => {
  console.log(`[NOVA ID] Connectée en tant que ${client.user.tag} ✅`);
  client.user.setActivity(`${CMD_CREATE} | ${CMD_GET}`, { type: 3 }); // 3 = Regarde
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return; // ignore les messages privés, rôles inexistants en MP

  const content = message.content.trim();
  const firstWord = content.split(/\s+/)[0]?.toLowerCase();

  try {
    if (firstWord === CMD_CREATE) {
      await createId.sendPrompt(message);
      return;
    }

    if (firstWord === CMD_GET) {
      await getId.sendPrompt(message);
      return;
    }

    if (firstWord === CMD_DELETE) {
      await deleteId.run(message);
      return;
    }
  } catch (error) {
    console.error("[NOVA ID] Erreur lors du traitement de la commande:", error);
    message.channel
      .send("⚠️ Une erreur est survenue lors du traitement de ta demande.")
      .catch(() => {});
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === createId.CREATE_BUTTON_ID) {
        await createId.handleButton(interaction);
      } else if (interaction.customId === getId.GET_BUTTON_ID) {
        await getId.handleButton(interaction);
      } else if (interaction.customId.startsWith(deleteId.CONFIRM_PREFIX)) {
        await deleteId.handleConfirmButton(interaction);
      } else if (interaction.customId.startsWith(deleteId.CANCEL_PREFIX)) {
        await deleteId.handleCancelButton(interaction);
      } else if (interaction.customId.startsWith(deleteId.DELETE_PREFIX)) {
        await deleteId.handleDeleteButton(interaction);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === createId.CREATE_MODAL_ID) {
        await createId.handleModalSubmit(interaction);
      } else if (interaction.customId === getId.GET_MODAL_ID) {
        await getId.handleModalSubmit(interaction);
      }
      return;
    }
  } catch (error) {
    console.error("[NOVA ID] Erreur lors du traitement de l'interaction:", error);

    const errorMessage = {
      content: "⚠️ Une erreur est survenue lors du traitement de ta demande.",
      ephemeral: true,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (innerError) {
      console.error("[NOVA ID] Impossible d'envoyer le message d'erreur:", innerError);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
