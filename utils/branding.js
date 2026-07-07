const path = require("path");
const { AttachmentBuilder } = require("discord.js");

const BANNER_PATH = path.join(__dirname, "..", "assets", "branding", "nova-banner.png");
const BANNER_FILENAME = "nova-banner.png";

/**
 * Retourne un AttachmentBuilder pour la bannière officielle de Nova,
 * à utiliser avec un embed via `.setImage("attachment://nova-banner.png")`.
 */
function getBannerAttachment() {
  return new AttachmentBuilder(BANNER_PATH, { name: BANNER_FILENAME });
}

module.exports = { getBannerAttachment, BANNER_FILENAME };
