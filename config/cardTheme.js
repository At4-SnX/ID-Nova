/**
 * ============================================================
 *  CONFIGURATION DE LA CARTE D'IDENTITÉ — CITÉ-ÉTAT DE NOVA
 *  -> Modifie ici les textes, couleurs et réglages de la carte
 *     sans toucher au reste du code.
 * ============================================================
 */

module.exports = {
  // Textes affichés sur la carte
  TEXT: {
    STATE_NAME: "CITÉ-ÉTAT DE NOVA",
    DOCUMENT_TITLE: "CARTE D'IDENTITÉ CITOYENNE",
    DOCUMENT_SUBTITLE: "CITIZEN IDENTITY CARD",
    NATIONALITY: "NOVA",
    FLAG_CODE: "NVA",
    WATERMARK: "NOVA",
  },

  // Palette de couleurs (format hexadécimal) - assortie au visuel violet/indigo de Nova
  COLORS: {
    BACKGROUND_TOP: "#eef0fb",
    BACKGROUND_BOTTOM: "#dbdcf3",
    HEADER_BLUE: "#2c2568",
    ACCENT_RED: "#c23b5a",
    TEXT_DARK: "#1c1a33",
    TEXT_LABEL: "#615c85",
    LINE_GREY: "#c7c5e0",
    FLAG_BOX: "#241f52",
    FLAG_STAR: "#f2c14e",
    PHOTO_BORDER: "#531e95",
    WATERMARK_COLOR: "rgba(44, 37, 104, 0.07)",
  },

  // Durée de validité d'une carte, en années, à partir de la création
  VALIDITY_YEARS: 5,

  // Dimensions de rendu de l'image finale (ratio proche d'une vraie carte ID)
  CANVAS: {
    WIDTH: 1200,
    HEIGHT: 756,
  },
};
