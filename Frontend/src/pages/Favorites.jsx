import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";
import { getLikedGames } from "../utils/gameService";

export default function Favorites() {
  const [likedGames, setLikedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const loadLikedGames = async () => {
      try {
        const token = localStorage.getItem("steam_token");

        if (!token) {
          navigate("/login");
          return;
        }

        // Obtener info del usuario
        const userRes = await fetch(`${API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) {
          localStorage.removeItem("steam_token");
          navigate("/login");
          return;
        }

        const user = await userRes.json();
        setUserId(user.id);

        // Obtener juegos favoritos desde Firebase
        const games = await getLikedGames(user.id);
        console.log("❤️ Juegos favoritos:", games.length);
        setLikedGames(games);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error cargando favoritos:", err);
        setLoading(false);
      }
    };

    loadLikedGames();
  }, [API_URL, navigate]);

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 className="page-title">Cargando favoritos...</h1>
      </div>
    );
  }

  if (likedGames.length === 0) {
    return (
      <div className="login-screen">
        <h1 className="page-title" style={{ textAlign: "center" }}>
          ❤️ Juegos Favoritos
        </h1>
        <p style={{ 
          textAlign: "center", 
          color: "#aaa", 
          marginTop: "20px",
          fontSize: "16px"
        }}>
          Aún no has marcado ningún juego como favorito.
        </p>
        <p style={{ 
          textAlign: "center", 
          color: "#aaa", 
          marginTop: "10px",
          fontSize: "14px"
        }}>
          Ve a tu biblioteca y marca tus juegos favoritos con ❤️
        </p>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <h1 className="page-title" style={{ textAlign: "center" }}>
        ❤️ Juegos Favoritos ({likedGames.length})
      </h1>
      <p style={{ 
        textAlign: "center", 
        color: "#aaa", 
        marginBottom: "30px",
        fontSize: "14px"
      }}>
        Tus juegos favoritos de Steam
      </p>
      <div className="games-grid-vertical">
        {likedGames.map((game) => (
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