import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";

function Library() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const token = localStorage.getItem("steam_token");

        console.log("🔍 Buscando token...");
        console.log("📦 Token en localStorage:", token ? "✅ EXISTE" : "❌ NO EXISTE");

        if (!token) {
          throw new Error("No autenticado. Inicia sesión primero.");
        }

        console.log("🎟️ Token encontrado, verificando usuario...");

        // Verificar token y obtener info del usuario
        const userRes = await fetch(`${API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) {
          localStorage.removeItem("steam_token");
          throw new Error("Sesión expirada. Inicia sesión nuevamente.");
        }

        const user = await userRes.json();
        console.log("✅ Usuario autenticado:", user.displayName || user.id);
        setUserId(user.id);

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
        <h1 className="page-title">Cargando tus juegos <span class="emoji-color">👀</span>...</h1>
      </div>
    );

  if (error)
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 className="page-title"><span class="emoji-color">😢</span> Error</h1>
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
      <p style={{ 
        textAlign: "center", 
        color: "#aaa", 
        marginBottom: "30px",
        fontSize: "14px"
      }}>
        Pasa el mouse sobre un juego para marcarlo como favorito ❤️ o jugado 👁️
      </p>
      <div className="games-grid-vertical">
        {library.map((game) => (
          <GameCard 
            key={game.appid} 
            game={game} 
            userId={userId}
          />
        ))}
      </div>
    </div>
  );
}

export default Library;