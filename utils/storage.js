/**
 * Stockage simple des cartes d'identité dans un fichier JSON local.
 *
 * ⚠️ IMPORTANT : sur Railway, le système de fichiers est éphémère par
 * défaut. Cela veut dire que ce fichier sera réinitialisé à chaque
 * redéploiement du bot. Si tu veux une persistance garantie entre les
 * redéploiements, ajoute un "Volume" Railway monté sur le dossier `data/`
 * (Settings > Volumes dans ton service Railway). Sans ça, les cartes
 * survivent tant que le service tourne, mais sont perdues à chaque
 * nouveau déploiement.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "cards.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ cards: [] }, null, 2), "utf8");
  }
}

function loadData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.cards)) parsed.cards = [];
    return parsed;
  } catch (error) {
    console.error("[NOVA ID] Erreur de lecture de data/cards.json, réinitialisation:", error);
    return { cards: [] };
  }
}

function saveData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Nombre de cartes déjà créées PAR ce membre Discord (le créateur).
 */
function countCardsByCreator(discordUserId) {
  const data = loadData();
  return data.cards.filter((c) => c.createdByDiscordId === discordUserId).length;
}

/**
 * Ajoute une carte et retourne l'objet carte complet (avec cardId généré).
 */
function addCard(card) {
  const data = loadData();
  const cardId = generateCardId();
  const fullCard = { cardId, ...card };
  data.cards.push(fullCard);
  saveData(data);
  return fullCard;
}

/**
 * Recherche toutes les cartes liées à un pseudo Roblox (insensible à la casse).
 */
function getCardsByRobloxUsername(username) {
  const data = loadData();
  const target = username.trim().toLowerCase();
  return data.cards.filter((c) => c.robloxUsername.toLowerCase() === target);
}

/**
 * Recherche toutes les cartes créées PAR un membre Discord donné.
 */
function getCardsByCreator(discordUserId) {
  const data = loadData();
  return data.cards.filter((c) => c.createdByDiscordId === discordUserId);
}

/**
 * Recherche une carte précise par son identifiant.
 */
function getCardById(cardId) {
  const data = loadData();
  return data.cards.find((c) => c.cardId === cardId) || null;
}

/**
 * Supprime une carte par son identifiant. Retourne la carte supprimée,
 * ou null si elle n'existait pas.
 */
function removeCardById(cardId) {
  const data = loadData();
  const index = data.cards.findIndex((c) => c.cardId === cardId);
  if (index === -1) return null;
  const [removed] = data.cards.splice(index, 1);
  saveData(data);
  return removed;
}

function generateCardId() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

/**
 * Génère un numéro de document façon carte d'identité (ex: D2H6862M2).
 */
function generateDocumentNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 9; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

module.exports = {
  loadData,
  saveData,
  countCardsByCreator,
  addCard,
  getCardsByRobloxUsername,
  getCardsByCreator,
  getCardById,
  removeCardById,
  generateDocumentNumber,
};
