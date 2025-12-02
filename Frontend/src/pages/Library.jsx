import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Eye } from 'lucide-react';
import { 
  addLikedGame, 
  removeLikedGame, 
  isGameLiked,
  addPlayedGame,
  removePlayedGame,
  isGamePlayed
} from "../utils/gameService";

function Library() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [gameStates, setGameStates] = useState({});
  const [hoveredGame, setHoveredGame] = useState(null);
  const [processingGame, setProcessingGame] = useState(null);
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

        // Cargar estados de todos los juegos
        const states = {};
        for (const game of games) {
          const [liked, played] = await Promise.all([
            isGameLiked(user.id, game.appid),
            isGamePlayed(user.id, game.appid)
          ]);
          states[game.appid] = { liked, played };
        }
        setGameStates(states);
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

  const handleLike = async (game, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (processingGame === game.appid || !userId) return;
    
    setProcessingGame(game.appid);
    
    try {
      const currentState = gameStates[game.appid]?.liked || false;
      
      if (currentState) {
        const success = await removeLikedGame(userId, game.appid);
        if (success) {
          setGameStates(prev => ({
            ...prev,
            [game.appid]: { ...prev[game.appid], liked: false }
          }));
        }
      } else {
        const success = await addLikedGame(userId, game);
        if (success) {
          setGameStates(prev => ({
            ...prev,
            [game.appid]: { ...prev[game.appid], liked: true }
          }));
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setProcessingGame(null);
    }
  };

  const handlePlayed = async (game, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (processingGame === game.appid || !userId) return;
    
    setProcessingGame(game.appid);
    
    try {
      const currentState = gameStates[game.appid]?.played || false;
      
      if (currentState) {
        const success = await removePlayedGame(userId, game.appid);
        if (success) {
          setGameStates(prev => ({
            ...prev,
            [game.appid]: { ...prev[game.appid], played: false }
          }));
        }
      } else {
        const success = await addPlayedGame(userId, game);
        if (success) {
          setGameStates(prev => ({
            ...prev,
            [game.appid]: { ...prev[game.appid], played: true }
          }));
        }
      }
    } catch (error) {
      console.error("Error toggling played:", error);
    } finally {
      setProcessingGame(null);
    }
  };

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
      <p style={{ 
        textAlign: "center", 
        color: "#aaa", 
        marginBottom: "30px",
        fontSize: "14px"
      }}>
        Pasa el mouse sobre un juego para marcarlo como favorito ❤️ o jugado 👁️
      </p>
      <div className="games-grid-vertical">
        {library.map((game) => {
          const gameName = game.name || "Juego desconocido";
          const hoursPlayed = ((game.playtime_forever || 0) / 60).toFixed(1);
          const verticalImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
          const horizontalImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
          const isHovered = hoveredGame === game.appid;
          const isLiked = gameStates[game.appid]?.liked || false;
          const isPlayed = gameStates[game.appid]?.played || false;
          const isProcessing = processingGame === game.appid;

          return (
            <div 
              key={game.appid}
              className="game-card-vertical"
              onMouseEnter={() => setHoveredGame(game.appid)}
              onMouseLeave={() => setHoveredGame(null)}
            >
              <h3 className="game-card-title">{gameName}</h3>
              
              <div style={{ position: 'relative' }}>
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
                
                {/* Overlay con botones */}
                {isHovered && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '20px',
                      transition: 'opacity 0.3s ease',
                      zIndex: 10
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {/* Botón Like */}
                    <button
                      onClick={(e) => handleLike(game, e)}
                      disabled={isProcessing}
                      style={{
                        background: isLiked 
                          ? 'linear-gradient(135deg, #ff6b6b, #ee5a6f)' 
                          : 'rgba(255, 255, 255, 0.2)',
                        border: isLiked ? 'none' : '2px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isProcessing ? 0.6 : 1,
                        transform: isLiked ? 'scale(1.1)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 107, 107, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = isLiked ? 'scale(1.1)' : 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Heart 
                        size={24} 
                        fill={isLiked ? '#fff' : 'none'} 
                        color="#fff"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    </button>

                    {/* Botón Played */}
                    <button
                      onClick={(e) => handlePlayed(game, e)}
                      disabled={isProcessing}
                      style={{
                        background: isPlayed 
                          ? 'linear-gradient(135deg, #4ade80, #22c55e)' 
                          : 'rgba(255, 255, 255, 0.2)',
                        border: isPlayed ? 'none' : '2px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isProcessing ? 0.6 : 1,
                        transform: isPlayed ? 'scale(1.1)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 222, 128, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = isPlayed ? 'scale(1.1)' : 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Eye 
                        size={24} 
                        fill={isPlayed ? '#fff' : 'none'} 
                        color="#fff"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    </button>
                  </div>
                )}
              </div>

              <div className="game-card-content">
                <p className="game-card-description">{hoursPlayed} horas jugadas</p>
                
                {/* Indicadores pequeños cuando no hay hover */}
                {!isHovered && (isLiked || isPlayed) && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}>
                    {isLiked && (
                      <Heart 
                        size={16} 
                        fill="#ff6b6b" 
                        color="#ff6b6b"
                      />
                    )}
                    {isPlayed && (
                      <Eye 
                        size={16} 
                        fill="#4ade80" 
                        color="#4ade80"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Library;