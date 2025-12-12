import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Verificar si ya hay un token válido
    const checkExistingToken = async () => {
      const token = localStorage.getItem("steam_token");
      
      if (token) {
        console.log("🔍 Token encontrado, verificando validez...");
        try {
          const res = await fetch(`${API_URL}/api/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            console.log("✅ Token válido, redirigiendo a biblioteca...");
            navigate("/library");
            return;
          } else {
            console.log("❌ Token inválido, eliminando...");
            localStorage.removeItem("steam_token");
          }
        } catch (err) {
          console.error("Error verificando token:", err);
          localStorage.removeItem("steam_token");
        }
      }
      
      setChecking(false);
    };

    checkExistingToken();
  }, [API_URL, navigate]);

  const handleSteamLogin = () => {
    console.log("🚀 Iniciando login con Steam...");
    console.log("🔗 URL:", `${API_URL}/auth/steam`);
    // Redirigir al login de Steam a través del backend
    window.location.href = `${API_URL}/auth/steam`;
  };

  if (checking) {
    return (
      <div className="login-screen">
        <h1 className="login-title">Verificando sesión...</h1>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <h1 className="login-title">Únete ahora <span class="emoji-color">👤</span></h1>
      <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '16px' }}>
        Conecta tu cuenta de Steam para ver tu biblioteca
      </p>
      <button className="login-button" onClick={handleSteamLogin}>
        Iniciar sesión con Steam
      </button>
      
     
    </div>
  );
};

export default LoginScreen;