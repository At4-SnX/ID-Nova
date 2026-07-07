const { createCanvas, GlobalFonts, loadImage } = require("@napi-rs/canvas");
const path = require("path");
const theme = require("../config/cardTheme");

// Enregistrement des polices une seule fois au chargement du module
const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts");
GlobalFonts.registerFromPath(path.join(FONTS_DIR, "PTSans-Regular.ttf"), "Nova Sans");
GlobalFonts.registerFromPath(path.join(FONTS_DIR, "PTSans-Bold.ttf"), "Nova Sans Bold");

const { WIDTH, HEIGHT } = theme.CANVAS;
const C = theme.COLORS;
const T = theme.TEXT;
const CORNER_RADIUS = 28;

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, C.BACKGROUND_TOP);
  gradient.addColorStop(1, C.BACKGROUND_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Fines lignes de sécurité décoratives (style guilloche simplifié)
  ctx.save();
  ctx.strokeStyle = "rgba(44, 37, 104, 0.05)";
  ctx.lineWidth = 1;
  for (let i = -HEIGHT; i < WIDTH; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + HEIGHT, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();

  // Bande "holographique" verticale, façon carte moderne
  ctx.save();
  const holoX = WIDTH - 210;
  const holoGrad = ctx.createLinearGradient(holoX, 0, holoX + 90, HEIGHT);
  holoGrad.addColorStop(0, "rgba(194, 59, 90, 0.10)");
  holoGrad.addColorStop(0.5, "rgba(242, 193, 78, 0.10)");
  holoGrad.addColorStop(1, "rgba(44, 37, 104, 0.14)");
  ctx.fillStyle = holoGrad;
  ctx.fillRect(holoX, 0, 90, HEIGHT);
  ctx.restore();
}

function drawWatermark(ctx) {
  ctx.save();
  ctx.fillStyle = C.WATERMARK_COLOR;
  ctx.font = "bold 80px 'Nova Sans Bold'";
  ctx.textBaseline = "middle";
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.rotate(-0.35);
  for (let y = -HEIGHT; y < HEIGHT; y += 130) {
    for (let x = -WIDTH; x < WIDTH; x += 420) {
      ctx.fillText(T.WATERMARK, x, y);
    }
  }
  ctx.restore();
}

/**
 * Icône stylisée d'un palmier, dans l'esprit du blason de Nova.
 */
function drawPalmIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const trunkTopY = cy - size * 0.15;
  const trunkBottomY = cy + size * 0.75;

  ctx.lineWidth = size * 0.09;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.05, trunkBottomY);
  ctx.quadraticCurveTo(cx - size * 0.15, cy + size * 0.25, cx, trunkTopY);
  ctx.stroke();

  const fronds = [-100, -55, -15, 25, 70];
  ctx.lineWidth = size * 0.075;
  for (const angleDeg of fronds) {
    const angle = (angleDeg * Math.PI) / 180;
    const length = size * 0.52;
    const midX = cx + Math.cos(angle) * length * 0.55;
    const midY = trunkTopY + Math.sin(angle) * length * 0.55 - size * 0.15;
    const endX = cx + Math.cos(angle) * length;
    const endY = trunkTopY + Math.sin(angle) * length * 0.7 - size * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx, trunkTopY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEmblem(ctx, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = C.HEADER_BLUE;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ACCENT_RED;
  ctx.stroke();

  drawPalmIcon(ctx, cx, cy + radius * 0.12, radius * 1.15, C.FLAG_STAR);
  ctx.restore();
}

function drawFlagBox(ctx) {
  const boxW = 150;
  const boxH = 100;
  const x = WIDTH - 40 - boxW;
  const y = 22;

  ctx.save();
  ctx.fillStyle = C.FLAG_BOX;
  roundRectPath(ctx, x, y, boxW, boxH, 6);
  ctx.fill();

  drawPalmIcon(ctx, x + boxW / 2, y + boxH / 2 - 20, 44, C.FLAG_STAR);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'Nova Sans Bold'";
  ctx.textAlign = "center";
  ctx.fillText(T.FLAG_CODE, x + boxW / 2, y + boxH - 14);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawHeader(ctx) {
  drawEmblem(ctx, 78, 62, 40);

  ctx.fillStyle = C.HEADER_BLUE;
  ctx.font = "bold 34px 'Nova Sans Bold'";
  ctx.fillText(T.STATE_NAME, 138, 50);

  ctx.fillStyle = C.TEXT_LABEL;
  ctx.font = "19px 'Nova Sans'";
  ctx.fillText(`${T.DOCUMENT_TITLE} / ${T.DOCUMENT_SUBTITLE}`, 138, 82);

  drawFlagBox(ctx);
}

async function drawPhoto(ctx, avatarUrl, x, y, w, h) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = "#c9c8e4";
  ctx.fillRect(x, y, w, h);

  if (avatarUrl) {
    try {
      const image = await loadImage(avatarUrl);
      const scale = Math.max(w / image.width, h / image.height);
      const dw = image.width * scale;
      const dh = image.height * scale;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;
      ctx.drawImage(image, dx, dy, dw, dh);
    } catch (error) {
      console.error("[NOVA ID] Impossible de charger l'avatar Roblox:", error);
      drawPhotoPlaceholder(ctx, x, y, w, h);
    }
  } else {
    drawPhotoPlaceholder(ctx, x, y, w, h);
  }
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = C.PHOTO_BORDER;
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();
}

function drawPhotoPlaceholder(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#726e99";
  ctx.font = "18px 'Nova Sans'";
  ctx.textAlign = "center";
  ctx.fillText("PHOTO", x + w / 2, y + h / 2 - 10);
  ctx.fillText("INDISPONIBLE", x + w / 2, y + h / 2 + 16);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawField(ctx, label, value, x, y, options = {}) {
  const { labelSize = 15, valueSize = 28, bold = true } = options;

  ctx.fillStyle = C.TEXT_LABEL;
  ctx.font = `${labelSize}px 'Nova Sans'`;
  ctx.fillText(label, x, y);

  ctx.fillStyle = C.TEXT_DARK;
  ctx.font = `${bold ? "bold " : ""}${valueSize}px 'Nova Sans${bold ? " Bold" : ""}'`;
  ctx.fillText(value, x, y + valueSize + 6);
}

function drawSignature(ctx, x, y, seed) {
  ctx.save();
  ctx.strokeStyle = C.HEADER_BLUE;
  ctx.lineWidth = 2.2;
  ctx.beginPath();

  let rand = mulberry32(hashSeed(seed));
  let cx = x;
  let cy = y;
  ctx.moveTo(cx, cy);
  for (let i = 0; i < 14; i++) {
    const dx = 12 + rand() * 14;
    const dy = (rand() - 0.5) * 34;
    cx += dx;
    cy = y + dy;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Code-barres décoratif déterministe (basé sur le numéro de document),
 * pour renforcer le côté "document officiel".
 */
function drawBarcode(ctx, x, y, w, h, seed) {
  ctx.save();
  const rand = mulberry32(hashSeed(seed + "-barcode"));
  ctx.fillStyle = C.TEXT_DARK;
  let cursor = x;
  while (cursor < x + w) {
    const barWidth = 1.5 + rand() * 3.5;
    if (rand() > 0.42) {
      ctx.fillRect(cursor, y, barWidth, h);
    }
    cursor += barWidth + 1.5;
  }
  ctx.restore();
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Génère l'image (Buffer PNG) d'une carte d'identité Nova.
 *
 * @param {Object} data
 * @param {string} data.nom
 * @param {string} data.prenoms
 * @param {string} data.sexe - "M", "F" ou "NB"
 * @param {string} data.dateNaissance - format libre saisi par l'utilisateur
 * @param {string} data.lieuNaissance
 * @param {string} data.documentNo
 * @param {string} data.dateExpir
 * @param {string|null} data.avatarUrl
 * @returns {Promise<Buffer>}
 */
async function renderIdCard(data) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Découpe la carte avec des coins arrondis pour un rendu plus réaliste
  ctx.save();
  roundRectPath(ctx, 0, 0, WIDTH, HEIGHT, CORNER_RADIUS);
  ctx.clip();

  drawBackground(ctx);
  drawWatermark(ctx);
  drawHeader(ctx);

  const photoX = 50;
  const photoY = 150;
  const photoW = 320;
  const photoH = 400;
  await drawPhoto(ctx, data.avatarUrl, photoX, photoY, photoW, photoH);

  const colX = 420;
  let cursorY = 150;

  drawField(ctx, "NOM / Surname", data.nom.toUpperCase(), colX, cursorY, { valueSize: 32 });
  cursorY += 78;

  drawField(ctx, "Prénoms / Given names", data.prenoms, colX, cursorY, { valueSize: 28 });
  cursorY += 78;

  drawField(ctx, "SEXE / Sex", data.sexe.toUpperCase(), colX, cursorY, { valueSize: 24 });
  drawField(ctx, "NATIONALITÉ / Citizenship", T.NATIONALITY, colX + 150, cursorY, { valueSize: 24 });
  drawField(ctx, "DATE DE NAISS. / Date of birth", data.dateNaissance, colX + 400, cursorY, {
    valueSize: 24,
  });
  cursorY += 78;

  drawField(ctx, "LIEU DE NAISSANCE / Place of birth", data.lieuNaissance, colX, cursorY, {
    valueSize: 26,
  });
  cursorY += 78;

  drawField(ctx, "N° DU DOCUMENT / Document No.", data.documentNo, colX, cursorY, {
    valueSize: 24,
  });
  drawField(ctx, "DATE D'EXPIR. / Expiry date", data.dateExpir, colX + 400, cursorY, {
    valueSize: 24,
  });
  cursorY += 90;

  ctx.fillStyle = C.TEXT_LABEL;
  ctx.font = "16px 'Nova Sans'";
  ctx.fillText("Signature", colX, cursorY);
  drawSignature(ctx, colX, cursorY + 30, data.documentNo);

  // Code-barres décoratif
  drawBarcode(ctx, colX + 380, cursorY - 8, 280, 46, data.documentNo);

  // Ligne décorative façon zone de lecture optique (purement esthétique)
  ctx.save();
  ctx.fillStyle = "rgba(44, 37, 104, 0.5)";
  ctx.font = "20px 'Nova Sans'";
  const mrz = `NVA<<${data.nom.toUpperCase().replace(/\s+/g, "<")}<<${data.prenoms
    .toUpperCase()
    .replace(/\s+/g, "<")}<<<<<<<<<<<<<<<<<<<`;
  ctx.fillText(mrz.slice(0, 62), 50, HEIGHT - 34);
  ctx.restore();

  ctx.restore(); // fin du clip coins arrondis

  // Bordure extérieure façon carte plastifiée, par-dessus le clip
  ctx.save();
  ctx.strokeStyle = "rgba(44, 37, 104, 0.28)";
  ctx.lineWidth = 3;
  roundRectPath(ctx, 4, 4, WIDTH - 8, HEIGHT - 8, CORNER_RADIUS - 4);
  ctx.stroke();
  ctx.restore();

  return canvas.toBuffer("image/png");
}

module.exports = { renderIdCard };
