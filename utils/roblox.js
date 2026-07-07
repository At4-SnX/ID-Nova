/**
 * Intégration avec les API publiques de Roblox.
 * Aucune clé API n'est nécessaire : ce sont des endpoints publics.
 */

/**
 * Résout un pseudo Roblox en objet { id, name, displayName }.
 * Retourne null si le pseudo n'existe pas.
 */
async function getRobloxUserByUsername(username) {
  const response = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernames: [username],
      excludeBannedUsers: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Roblox API (usernames) a répondu ${response.status}`);
  }

  const data = await response.json();
  const user = data?.data?.[0];
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
  };
}

/**
 * Récupère l'URL de l'avatar (headshot) d'un joueur Roblox à partir de son ID.
 */
async function getRobloxAvatarUrl(userId) {
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Roblox API (thumbnails) a répondu ${response.status}`);
  }

  const data = await response.json();
  const thumb = data?.data?.[0];
  if (!thumb || thumb.state !== "Completed") return null;

  return thumb.imageUrl;
}

/**
 * Fonction pratique : pseudo Roblox -> { user, avatarUrl }
 * Retourne null si le joueur n'existe pas.
 */
async function resolveRobloxPlayer(username) {
  const user = await getRobloxUserByUsername(username);
  if (!user) return null;

  const avatarUrl = await getRobloxAvatarUrl(user.id);
  return { user, avatarUrl };
}

module.exports = {
  getRobloxUserByUsername,
  getRobloxAvatarUrl,
  resolveRobloxPlayer,
};
