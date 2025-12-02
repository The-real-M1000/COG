import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User } from "lucide-react";
import { getLikedGames } from "../utils/gameService";

export default function Recommendation() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [likedGames, setLikedGames] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || "sk-your-key-here";

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar usuario y juegos favoritos
  useEffect(() => {
    const loadUserData = async () => {
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

        // Obtener juegos favoritos
        const games = await getLikedGames(user.id);
        setLikedGames(games);

        // Mensaje inicial del bot
        setMessages([
          {
            role: "assistant",
            content: "¿No sabes qué jugar? 🎮\n\nCuéntame qué tipo de experiencia buscas y te recomendaré juegos basándome en tus favoritos.",
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      }
    };

    loadUserData();
  }, [API_URL, navigate]);

  // Crear pre-prompt con juegos favoritos
  const createSystemPrompt = () => {
    const gamesList = likedGames.map((g) => g.name).join(", ");
    
    return `Eres un asistente experto en recomendaciones de videojuegos. 

El usuario tiene los siguientes juegos favoritos: ${gamesList || "ninguno aún"}.

INSTRUCCIONES:
- Recomienda juegos similares o que complementen sus favoritos
- Si pregunta por géneros específicos, sugiere juegos de ese género considerando sus gustos
- Si pregunta por historias, enfócate en narrativa y experiencias similares
- Sé conciso, amigable y entusiasta
- Menciona por qué crees que le gustará cada recomendación
- Limita tus respuestas a 3-5 recomendaciones por mensaje
- Si no tiene favoritos, pide más información sobre sus gustos

Responde siempre en español de manera casual y cercana.`;
  };

  // Enviar mensaje a DeepSeek
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: createSystemPrompt() },
            ...messages
              .filter((m) => m.role !== "system")
              .map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: input },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("❌ Error con DeepSeek:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="login-screen" style={{ 
      maxWidth: "900px", 
      margin: "0 auto",
      paddingTop: "100px"
    }}>
      <h1 className="page-title" style={{ marginBottom: "30px" }}>
        <span className="emoji-color">🤖</span> Recomendaciones IA
      </h1>

      {/* Chat Container */}
      <div
        style={{
          background: "rgba(29, 29, 31, 0.6)",
          backdropFilter: "blur(30px)",
          borderRadius: "20px",
          height: "600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "12px",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6E34BF, #872ADD)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} color="#fff" />
                </div>
              )}

              <div
                style={{
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #6E34BF, #872ADD)"
                      : "rgba(255, 255, 255, 0.1)",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  color: "#fff",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>

              {msg.role === "user" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} color="#fff" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignSelf: "flex-start",
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6E34BF, #872ADD)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={18} color="#fff" />
              </div>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  color: "#aaa",
                }}
              >
                Pensando...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pide con base a géneros o historias, alimentado con tus juegos favoritos..."
                disabled={loading}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "#fff",
                  fontSize: "15px",
                  resize: "none",
                  minHeight: "48px",
                  maxHeight: "120px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                rows={1}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() 
                  ? "rgba(110, 52, 191, 0.3)" 
                  : "linear-gradient(135deg, #6E34BF, #872ADD)",
                border: "none",
                borderRadius: "12px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <Send size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <p style={{ 
        textAlign: "center", 
        color: "#666", 
        fontSize: "13px", 
        marginTop: "20px" 
      }}>
        Basado en {likedGames.length} juegos favoritos • Powered by DeepSeek AI
      </p>
    </div>
  );
}