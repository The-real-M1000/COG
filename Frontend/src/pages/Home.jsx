import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Agregar clase 'home' al body cuando este componente se monta
    document.body.classList.add('home');
    
    // Remover la clase cuando el componente se desmonta
    return () => {
      document.body.classList.remove('home');
    };
  }, []);

  return (
    <div className="login-screen">
      <h1 className="page-title">Bienvenido a COG<span class="emoji-color">❤️</span></h1>
      <p style={{ fontSize: '18px', color: '#aaa', marginTop: '20px' }}>
      Companion Of Gamers  
      </p>
    </div>
  );
}