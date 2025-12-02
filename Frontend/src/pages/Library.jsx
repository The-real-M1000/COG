import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Library() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 🔹 Usar variable de entorno para el backend
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        // Obtener el token del localStorage
        const token = localStorage.getItem("steam_token");

        console.log("🔍 Buscando token...");
        console.log("📦 Token en localStorage:", token ? "✅ EXISTE" : "❌ NO EXISTE");
        console.log("📝 Contenido del token:", token ? token.substring(0, 30) + "..." : "null");
        console.log("🗄️ Todos los items en localStorage:", Object.keys(localStorage));

        if (!token) {
          throw new Error("No autenticado. Inicia sesión primero.");
        }

        console.log("🎟️ Token encontrado, verificando usuario...");

        // Primero verificar si el token es válido
        const userRes = await fetch(`${API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) {
          // Token inválido o expirado
          localStorage.removeItem("steam_token");
          throw new Error("Sesión expirada. Inicia sesión nuevamente.");
        }

        const user = await userRes.json();
        console.log("✅ Usuario autenticado:", user.displayName || user.id);

        // Obtener biblioteca
        console.log("📚 Obteniendo biblioteca...");
        const libraryRes = await fetch(`${API_URL}/api/library`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!libraryRes.ok) {
          throw new Error(`HTTP error! status: ${libraryRes.status}`);
        }

        const data = await libraryRes.json();
        console.log("📦 Datos recibidos:", data);

        // Manejar diferentes formatos de respuesta
        let games = [];

        if (Array.isArray(data)) {
          games = data;
        } else if (data.response && Array.isArray(data.response.games)) {
          games = data.response.games;
        } else if (Array.isArray(data.games)) {
          games = data.games;
        }

        console.log("🎮 Juegos procesados:", games.length, "juegos");
        setLibrary(games);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error cargando librería:", err);
        setError(err.message);
        setLoading(false);
        
        // Si hay error de autenticación, redirigir al login después de 2 segundos
        if (err.message.includes("autenticado") || err.message.includes("expirada")) {
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      }
    };

    loadLibrary();
  }, [API_URL, navigate]);

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
          Redirigiendo al login...
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