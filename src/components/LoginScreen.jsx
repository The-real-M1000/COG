import React, { useEffect } from "react";

const LoginScreen = ({ setUser }) => {
  useEffect(() => {
    fetch("https://cog-lovat.vercel.app/api/user", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUser(data);
      })
      .catch((err) => console.log("No hay sesión activa", err));
  }, [setUser]);

  const handleSteamLogin = () => {
    window.location.href = "https://cog-lovat.vercel.app//auth/steam";
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
