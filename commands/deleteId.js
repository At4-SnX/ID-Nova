const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const storage = require("../utils/storage");

const STAFF_ROLE_IDS = (process.env.STAFF_ROLE_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "";
const BRAND_COLOR = 0x2c2568;

const DELETE_PREFIX = "nova_delete_card_";
const CONFIRM_PREFIX = "nova_confirm_delete_";
const CANCEL_PREFIX = "nova_cancel_delete_";

function hasStaffAccess(member) {
  if (STAFF_ROLE_IDS.length === 0) return true;
  return member?.roles?.cache?.some((role) => STAFF_ROLE_IDS.includes(role.id)) ?? false;
}

function cardSummary(card) {
  return (
    `**Joueur Roblox :** ${card.robloxUsername}\n` +
    `**Nom RP :** ${card.nom} ${card.prenoms}\n` +
    `**N° de document :** ${card.documentNo}\n` +
    `**Créée par :** <@${card.createdByDiscordId}>`
  );
}

/**
 * Commande texte "nova.delid @joueur" — liste les cartes créées par ce
 * membre Discord, chacune avec un bouton de suppression. Réservé aux
 * rôles listés dans STAFF_ROLE_IDS.
 */
async function run(message) {
  if (!hasStaffAccess(message.member)) {
    await message.reply("⛔ Accès refusé.");
    return;
  }

  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    await message.reply("⚠️ Utilisation : `nova.delid @joueur` (mentionne le membre concerné).");
    return;
  }

  const cards = storage.getCardsByCreator(targetUser.id);
  if (cards.length === 0) {
    await message.reply(`ℹ️ Aucune carte d'identité trouvée pour <@${targetUser.id}>.`);
    return;
  }

  for (const card of cards) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("🪪 Carte d'identité")
      .setDescription(cardSummary(card));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${DELETE_PREFIX}${card.cardId}`)
        .setLabel("Supprimer cette carte")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
}

/**
 * Un membre du staff a cliqué sur "🗑️ Supprimer cette carte" (depuis le
 * salon de logs ou depuis "nova.delid") : on demande confirmation.
 */
async function handleDeleteButton(interaction) {
  if (!hasStaffAccess(interaction.member)) {
    await interaction.reply({ content: "⛔ Accès refusé.", ephemeral: true });
    return;
  }

  const cardId = interaction.customId.slice(DELETE_PREFIX.length);
  const card = storage.getCardById(cardId);

  if (!card) {
    await interaction.reply({
      content: "ℹ️ Cette carte a déjà été supprimée.",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("⚠️ Confirmer la suppression")
    .setDescription(
      `Es-tu sûr de vouloir supprimer cette carte ?\n\n${cardSummary(card)}\n\n` +
        `Le joueur pourra en créer une nouvelle après cette suppression.`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${CONFIRM_PREFIX}${cardId}`)
      .setLabel("Confirmer la suppression")
      .setEmoji("⚠️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`${CANCEL_PREFIX}${cardId}`)
      .setLabel("Annuler")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * Confirmation de suppression.
 */
async function handleConfirmButton(interaction) {
  if (!hasStaffAccess(interaction.member)) {
    await interaction.reply({ content: "⛔ Accès refusé.", ephemeral: true });
    return;
  }

  const cardId = interaction.customId.slice(CONFIRM_PREFIX.length);
  const removed = storage.removeCardById(cardId);

  if (!removed) {
    await interaction.update({
      content: "ℹ️ Cette carte avait déjà été supprimée.",
      embeds: [],
      components: [],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setDescription(
      `✅ Carte supprimée pour **${removed.robloxUsername}** (doc n° ${removed.documentNo}).\n` +
        `<@${removed.createdByDiscordId}> peut maintenant en créer une nouvelle.`
    );

  await interaction.update({ embeds: [embed], components: [] });

  if (LOG_CHANNEL_ID) {
    try {
      const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
      if (logChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor(BRAND_COLOR)
          .setTitle("🗑️ Carte supprimée")
          .addFields(
            { name: "Joueur Roblox", value: removed.robloxUsername, inline: true },
            { name: "N° de document", value: removed.documentNo, inline: true },
            { name: "Supprimée par", value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error("[NOVA ID] Impossible de notifier le salon logs de la suppression:", error);
    }
  }
}

/**
 * Annulation de la suppression.
 */
async function handleCancelButton(interaction) {
  await interaction.update({
    content: "❌ Suppression annulée.",
    embeds: [],
    components: [],
  });
}

module.exports = {
  DELETE_PREFIX,
  CONFIRM_PREFIX,
  CANCEL_PREFIX,
  run,
  handleDeleteButton,
  handleConfirmButton,
  handleCancelButton,
};
