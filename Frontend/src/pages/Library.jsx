import React, { useState, useEffect } from "react";

function Library() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/library", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((games) => {
        setLibrary(games);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando librería:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 className="page-title">Cargando tus jueguitos 👀...</h1>
      </div>
    );

  return (
    <div className="login-screen">
      <h1 className="page-title" style={{ textAlign: "center" }}>
        🎮 Tu Biblioteca
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