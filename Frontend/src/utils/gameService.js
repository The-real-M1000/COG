import { ref, set, get, remove } from "firebase/database";
import { db } from "../firebase";

/**
 * Guarda un juego como favorito (like) para un usuario
 */
export async function addLikedGame(userId, gameData) {
  try {
    const gameRef = ref(db, `users/${userId}/likedGames/${gameData.appid}`);
    await set(gameRef, {
      appid: gameData.appid,
      name: gameData.name,
      playtime_forever: gameData.playtime_forever || 0,
      img_icon_url: gameData.img_icon_url || "",
      timestamp: Date.now()
    });
    console.log("✅ Juego agregado a favoritos:", gameData.name);
    return true;
  } catch (error) {
    console.error("❌ Error agregando juego a favoritos:", error);
    return false;
  }
}

/**
 * Elimina un juego de favoritos
 */
export async function removeLikedGame(userId, appid) {
  try {
    const gameRef = ref(db, `users/${userId}/likedGames/${appid}`);
    await remove(gameRef);
    console.log("✅ Juego eliminado de favoritos");
    return true;
  } catch (error) {
    console.error("❌ Error eliminando juego de favoritos:", error);
    return false;
  }
}

/**
 * Verifica si un juego está en favoritos
 */
export async function isGameLiked(userId, appid) {
  try {
    const gameRef = ref(db, `users/${userId}/likedGames/${appid}`);
    const snapshot = await get(gameRef);
    return snapshot.exists();
  } catch (error) {
    console.error("❌ Error verificando favorito:", error);
    return false;
  }
}

/**
 * Obtiene todos los juegos favoritos de un usuario
 */
export async function getLikedGames(userId) {
  try {
    const gamesRef = ref(db, `users/${userId}/likedGames`);
    const snapshot = await get(gamesRef);
    
    if (snapshot.exists()) {
      const games = [];
      snapshot.forEach((childSnapshot) => {
        games.push(childSnapshot.val());
      });
      return games;
    }
    return [];
  } catch (error) {
    console.error("❌ Error obteniendo juegos favoritos:", error);
    return [];
  }
}

/**
 * Marca un juego como jugado
 */
export async function addPlayedGame(userId, gameData) {
  try {
    const gameRef = ref(db, `users/${userId}/playedGames/${gameData.appid}`);
    await set(gameRef, {
      appid: gameData.appid,
      name: gameData.name,
      playtime_forever: gameData.playtime_forever || 0,
      img_icon_url: gameData.img_icon_url || "",
      timestamp: Date.now()
    });
    console.log("✅ Juego marcado como jugado:", gameData.name);
    return true;
  } catch (error) {
    console.error("❌ Error marcando juego como jugado:", error);
    return false;
  }
}

/**
 * Desmarca un juego como jugado
 */
export async function removePlayedGame(userId, appid) {
  try {
    const gameRef = ref(db, `users/${userId}/playedGames/${appid}`);
    await remove(gameRef);
    console.log("✅ Juego desmarcado como jugado");
    return true;
  } catch (error) {
    console.error("❌ Error desmarcando juego:", error);
    return false;
  }
}

/**
 * Verifica si un juego está marcado como jugado
 */
export async function isGamePlayed(userId, appid) {
  try {
    const gameRef = ref(db, `users/${userId}/playedGames/${appid}`);
    const snapshot = await get(gameRef);
    return snapshot.exists();
  } catch (error) {
    console.error("❌ Error verificando juego jugado:", error);
    return false;
  }
}

/**
 * Obtiene todos los juegos jugados de un usuario
 */
export async function getPlayedGames(userId) {
  try {
    const gamesRef = ref(db, `users/${userId}/playedGames`);
    const snapshot = await get(gamesRef);
    
    if (snapshot.exists()) {
      const games = [];
      snapshot.forEach((childSnapshot) => {
        games.push(childSnapshot.val());
      });
      return games;
    }
    return [];
  } catch (error) {
    console.error("❌ Error obteniendo juegos jugados:", error);
    return [];
  }
}