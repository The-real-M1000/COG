import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      console.log("🎟️ Token recibido, guardando...");
      // Guardar el token en localStorage
      localStorage.setItem("steam_token", token);
      
      // Redirigir a la biblioteca
      console.log("✅ Redirigiendo a biblioteca...");
      navigate("/library");
    } else {
      console.error("❌ No se recibió token");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="login-screen">
      <h1 className="page-title">🔐 Autenticando...</h1>
      <p style={{ color: '#aaa', marginTop: '20px' }}>
        Procesando tu inicio de sesión con Steam
      </p>
    </div>
  );
}