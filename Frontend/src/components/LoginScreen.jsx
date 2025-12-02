import React, { useEffect } from "react";

const LoginScreen = ({ setUser }) => {
  // 🔹 Usar variable de entorno para backend
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetch(`${API_URL}/api/user`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUser(data);
      })
      .catch((err) => console.log("No hay sesión activa", err));
  }, [setUser, API_URL]);

  const handleSteamLogin = () => {
    window.location.href = `${API_URL}/auth/steam`;
  };

  return (
    <div className="login-screen">
      <h1 className="login-title">Unete ahora 👤</h1>

      <button className="login-button" onClick={handleSteamLogin}>
        Iniciar sesión con Steam
      </button>
    </div>
  );
};

export default LoginScreen;
