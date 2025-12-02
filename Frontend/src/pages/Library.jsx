import React, { useState, useEffect } from "react";

function Library() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Usar variable de entorno para el backend
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Primero verificar si hay sesión
    fetch(`${API_URL}/api/user`, {
      credentials: "include",
      mode: "cors",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`No autenticado. Inicia sesión primero.`);
        }
        return res.json();
      })
      .then(() => {
        // Si hay sesión, obtener biblioteca
        return fetch(`${API_URL}/api/library`, {
          credentials: "include",
          mode: "cors",
        });
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("📦 Datos recibidos:", data);
        
        // Manejar diferentes formatos de respuesta
        let games = [];
        
        if (Array.isArray(data)) {
          // Si ya es un array
          games = data;
        } else if (data.response && Array.isArray(data.response.games)) {
          // Si viene en formato { response: { games: [...] } }
          games = data.response.games;
        } else if (Array.isArray(data.games)) {
          // Si viene en formato { games: [...] }
          games = data.games;
        }
        
        console.log("🎮 Juegos procesados:", games);
        setLibrary(games);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error cargando librería:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [API_URL]);

  if (loading)
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 className="page-title">Cargando tus jueguitos 👀...</h1>
      </div>
    );

  if (error)
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 className="page-title">😢 Error</h1>
        <p style={{ color: "#ff6b6b", marginTop: "20px" }}>{error}</p>
        <p style={{ color: "#aaa", marginTop: "10px" }}>
          Asegúrate de haber iniciado sesión con Steam
        </p>
      </div>
    );

  if (library.length === 0)
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 className="page-title">📚 Biblioteca vacía</h1>
        <p style={{ color: "#aaa", marginTop: "20px" }}>
          No se encontraron juegos en tu biblioteca de Steam
        </p>
      </div>
    );

  return (
    <div className="login-screen">
      <h1 className="page-title" style={{ textAlign: "center" }}>
        🎮 Tu Biblioteca ({library.length} juegos)
      </h1>
      <div className="games-grid-vertical">
        {library.map((game) => {
          const gameName = game.name || "Juego desconocido";
          const hoursPlayed = ((game.playtime_forever || 0) / 60).toFixed(1);
          const verticalImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
          const horizontalImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;

          return (
            <div key={game.appid} className="game-card-vertical">
              <h3 className="game-card-title">{gameName}</h3>
              <a 
                href={`https://store.steampowered.com/app/${game.appid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="game-card-image-vertical"
              >
                <img
                  src={verticalImg}
                  alt={gameName}
                  onError={(e) => (e.currentTarget.src = horizontalImg)}
                  style={{ objectFit: "cover", cursor: "pointer" }}
                />
              </a>
              <div className="game-card-content">
                <p className="game-card-description">{hoursPlayed} horas jugadas</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Library;