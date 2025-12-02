// utils/library.js
export async function getLibrary() {
  // 🔹 Usar variable de entorno para el backend
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${API_URL}/api/library`, {
      credentials: "include",
    });
    const data = await res.json();

    if (!data) return [];

    // CASO 1: backend devuelve { games: [...] }
    if (Array.isArray(data.games)) return data.games;

    // CASO 2: backend devuelve { response: { games: [...] } }
    if (data.response && Array.isArray(data.response.games)) return data.response.games;

    // CASO 3: ya devolvió un array
    if (Array.isArray(data)) return data;

    // CASO 4: fallback
    return [];
  } catch (err) {
    console.error("Error obteniendo la biblioteca:", err);
    return [];
  }
}
