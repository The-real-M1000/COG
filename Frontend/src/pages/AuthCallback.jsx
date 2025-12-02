import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Procesando...");

  useEffect(() => {
    const processAuth = () => {
      console.log("🔗 AuthCallback montado");
      console.log("📍 URL completa:", window.location.href);
      console.log("🔍 SearchParams:", searchParams.toString());
      
      const token = searchParams.get("token");

      if (token) {
        console.log("🎟️ Token recibido (primeros 20 chars):", token.substring(0, 20) + "...");
        setStatus("Token recibido, guardando...");
        
        // Guardar el token en localStorage
        localStorage.setItem("steam_token", token);
        console.log("💾 Token guardado en localStorage");
        
        // Verificar que se guardó correctamente
        const savedToken = localStorage.getItem("steam_token");
        if (savedToken === token) {
          console.log("✅ Token verificado en localStorage");
          setStatus("¡Autenticación exitosa! Redirigiendo...");
          
          // Redirigir a la biblioteca después de 1 segundo
          setTimeout(() => {
            console.log("➡️ Redirigiendo a /library");
            navigate("/library");
          }, 1000);
        } else {
          console.error("❌ Error: Token no se guardó correctamente");
          setStatus("Error guardando token");
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
        console.error("❌ No se recibió token en la URL");
        console.log("📋 Parámetros disponibles:", Array.from(searchParams.entries()));
        setStatus("Error: No se recibió token");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    };

    processAuth();
  }, [searchParams, navigate]);

  return (
    <div className="login-screen">
      <h1 className="page-title">🔐 Autenticando</h1>
      <p style={{ color: '#aaa', marginTop: '20px', fontSize: '18px' }}>
        {status}
      </p>
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p>Abre la consola (F12) para ver detalles técnicos</p>
      </div>
    </div>
  );
}