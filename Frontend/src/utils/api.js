export async function getLibrary() {
    const res = await fetch("http://localhost:5000/api/library", {
      credentials: "include"
    });
    const data = await res.json();
  
    if (!data) return [];
  
    // CASO 1: backend devuelve { games: [...] }
    if (Array.isArray(data.games)) return data.games;
  
    // CASO 2: backend devuelve { response: { games: [...] } }
    if (data.response && Array.isArray(data.response.games)) {
      return data.response.games;
    }
  
    // CASO 3: ya devolvió un array
    if (Array.isArray(data)) return data;
  
    // CASO 4: no sabemos qué llegó → evita el crash
    return [];
  }
  