const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require("discord.js");
const storage = require("../utils/storage");
const { getRobloxAvatarUrl } = require("../utils/roblox");
const { renderIdCard } = require("../utils/cardRenderer");
const { getBannerAttachment, BANNER_FILENAME } = require("../utils/branding");

const VIEWER_ROLE_IDS = (process.env.VIEWER_ROLE_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const GET_BUTTON_ID = "nova_get_open_modal";
const GET_MODAL_ID = "nova_get_modal";
const BRAND_COLOR = 0x2c2568;

function hasViewerAccess(member) {
  if (VIEWER_ROLE_IDS.length === 0) return true;
  return member?.roles?.cache?.some((role) => VIEWER_ROLE_IDS.includes(role.id)) ?? false;
}

/**
 * Envoie l'invitation publique (embed + bouton) suite au mot déclencheur
 * "nova.getid". L'accès réel est vérifié au clic sur le bouton.
 */
async function sendPrompt(message) {
  const banner = getBannerAttachment();

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("<:Link:1521998525536272606> NOVɅ RP — Registre des cartes d'identité")
    .setDescription(
      "Clique sur le **bouton ci-dessous** pour rechercher la **carte d'identité** d'un joueur.\n" +
        "> Réservé aux **personnes autorisées**."
    )
    .setImage(`attachment://${BANNER_FILENAME}`)
    .setFooter({ text: "Service des Cartes d'Identité de Nova" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(GET_BUTTON_ID)
      .setLabel("Rechercher un joueur")
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Secondary)
  );

  await message.channel.send({ embeds: [embed], components: [row], files: [banner] });
}

/**
 * Déclenché quand quelqu'un clique sur "Rechercher un joueur".
 */
async function handleButton(interaction) {
  if (!hasViewerAccess(interaction.member)) {
    await interaction.reply({ content: "⛔ Accès refusé.", ephemeral: true });
    return;
  }

  const modal = new ModalBuilder().setCustomId(GET_MODAL_ID).setTitle("Recherche — Registre Nova");

  const robloxInput = new TextInputBuilder()
    .setCustomId("roblox_username")
    .setLabel("Pseudo Roblox à rechercher")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(20)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(robloxInput));

  await interaction.showModal(modal);
}

/**
 * Déclenché à la soumission du formulaire de recherche.
 */
async function handleModalSubmit(interaction) {
  if (!hasViewerAccess(interaction.member)) {
    await interaction.reply({ content: "⛔ Accès refusé.", ephemeral: true });
    return;
  }

  const robloxUsername = interaction.fields.getTextInputValue("roblox_username").trim();

  await interaction.deferReply({ ephemeral: true });

  const cards = storage.getCardsByRobloxUsername(robloxUsername);
  if (cards.length === 0) {
    await interaction.editReply(`ℹ️ Aucune carte d'identité trouvée pour **${robloxUsername}**.`);
    return;
  }

  let avatarUrl = null;
  try {
    avatarUrl = await getRobloxAvatarUrl(cards[0].robloxUserId);
  } catch (error) {
    console.error("[NOVA ID] Impossible de récupérer l'avatar actuel:", error);
  }

  const embeds = [];
  const attachments = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    try {
      const buffer = await renderIdCard({
        nom: card.nom,
        prenoms: card.prenoms,
        sexe: card.sexe,
        dateNaissance: card.dateNaissance,
        lieuNaissance: card.lieuNaissance,
        documentNo: card.documentNo,
        dateExpir: card.dateExpir,
        avatarUrl,
      });
      const filename = `carte-nova-${i + 1}.png`;
      attachments.push(new AttachmentBuilder(buffer, { name: filename }));

      embeds.push(
        new EmbedBuilder()
          .setColor(BRAND_COLOR)
          .setTitle(`🪪 Carte d'identité — ${robloxUsername}`)
          .addFields(
            { name: "N° de document", value: card.documentNo, inline: true },
            { name: "Créée par", value: `<@${card.createdByDiscordId}>`, inline: true }
          )
          .setImage(`attachment://${filename}`)
          .setFooter({ text: "Cité-État de Nova • Document officiel" })
      );
    } catch (error) {
      console.error("[NOVA ID] Erreur de génération d'une carte:", error);
    }
  }

  if (embeds.length === 0) {
    await interaction.editReply("⚠️ Une erreur est survenue lors de la génération des cartes.");
    return;
  }

  await interaction.editReply({ embeds, files: attachments });
}

module.exports = { GET_BUTTON_ID, GET_MODAL_ID, sendPrompt, handleButton, handleModalSubmit };
