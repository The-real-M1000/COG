import React, { useState, useEffect, useRef } from 'react';
import { Heart, Eye } from 'lucide-react';
import { 
  addLikedGame, 
  removeLikedGame, 
  isGameLiked,
  addPlayedGame,
  removePlayedGame,
  isGamePlayed
} from '../utils/gameService';

// Agregar estilos de animación
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inyectar estilos si no existen
if (!document.getElementById('spinner-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'spinner-styles';
  styleSheet.textContent = spinnerStyles;
  document.head.appendChild(styleSheet);
}

export default function OptimizedGameCard({ game, userId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const cardRef = useRef(null);

  const gameName = game.name || "Juego desconocido";
  const hoursPlayed = ((game.playtime_forever || 0) / 60).toFixed(1);
  const verticalImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
  const horizontalImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Cargar imagen solo cuando sea visible
  useEffect(() => {
    if (!isVisible) return;

    const img = new Image();
    img.src = verticalImg;

    img.onload = () => {
      setImageSrc(verticalImg);
      setImageLoaded(true);
      setIsHorizontal(img.width > img.height);
    };

    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = horizontalImg;

      fallbackImg.onload = () => {
        setImageSrc(horizontalImg);
        setImageLoaded(true);
        setIsHorizontal(fallbackImg.width > fallbackImg.height);
      };

      fallbackImg.onerror = () => setImageLoaded(true);
    };
  }, [isVisible, verticalImg, horizontalImg]);

  // Verificar estado inicial
  useEffect(() => {
    const checkGameStatus = async () => {
      if (!userId) return;
      
      const [liked, played] = await Promise.all([
        isGameLiked(userId, game.appid),
        isGamePlayed(userId, game.appid)
      ]);
      
      setIsLiked(liked);
      setIsPlayed(played);
    };

    checkGameStatus();
  }, [userId, game.appid]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing || !userId) return;
    
    setIsProcessing(true);
    
    try {
      if (isLiked) {
        const success = await removeLikedGame(userId, game.appid);
        if (success) setIsLiked(false);
      } else {
        const success = await addLikedGame(userId, game);
        if (success) setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayed = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing || !userId) return;
    
    setIsProcessing(true);
    
    try {
      if (isPlayed) {
        const success = await removePlayedGame(userId, game.appid);
        if (success) setIsPlayed(false);
      } else {
        const success = await addPlayedGame(userId, game);
        if (success) setIsPlayed(true);
      }
    } catch (error) {
      console.error("Error toggling played:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      ref={cardRef}
      className="game-card-vertical"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '200px',
        height: '270px',
        overflow: 'hidden',
        borderRadius: '12px',
        background: '#111'
      }}
    >
      <h3 className="game-card-title">{gameName}</h3>
      
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <a 
          href={`https://store.steampowered.com/app/${game.appid}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          {!imageLoaded && (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: '3px solid #6E34BF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          )}
          
          {imageSrc && (
            <img
              src={imageSrc}
              alt={gameName}
              style={{ 
                objectFit: 'cover', 
                objectPosition: 'center center',
                width: '100%',
                height: '100%',
                cursor: "pointer",
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
              loading="lazy"
            />
          )}
        </a>
        
        {isHovered && imageLoaded && (
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
            <button
              onClick={handleLike}
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

            <button
              onClick={handlePlayed}
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
        {!isHovered && (isLiked || isPlayed) && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'center',
            marginTop: '8px'
          }}>
            {isLiked && <Heart size={16} fill="#ff6b6b" color="#ff6b6b" />}
            {isPlayed && <Eye size={16} fill="#4ade80" color="#4ade80" />}
          </div>
        )}
      </div>
    </div>
  );
}
