import React, { useEffect } from "react";

const LoginScreen = ({ setUser }) => {
  // 🔹 Usar variable de entorno para el backend
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.error) setUser(data);
      } catch (err) {
        console.log("No hay sesión activa", err);
      }
    };

    fetchUser();
  }, [setUser, API_URL]);

  const handleSteamLogin = () => {
    // 🔹 Redirigir al login de Steam a través del backend
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
