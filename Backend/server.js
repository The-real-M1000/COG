require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "jwt_secret_key_123";

// URLs dinámicas desde .env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// =========================
// 🔐 CORS dinámico con credenciales
// =========================
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// =========================
// 🍪 SESIÓN (solo para el flujo de Steam)
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave_ultrasecreta_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 10 * 60 * 1000,
      secure: FRONTEND_URL.startsWith('https://'),
      httpOnly: true,
      sameSite: FRONTEND_URL.startsWith('https://') ? 'none' : 'lax'
    }
  })
);

// =========================
// 🔑 PASSPORT
// =========================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// =========================
// 🔐 Middleware JWT
// =========================
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No autenticado - Token requerido" });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("✅ JWT válido para usuario:", decoded.id);
    next();
  } catch (err) {
    console.error("❌ JWT inválido:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// =========================
// 🟦 STEAM LOGIN
// =========================
passport.use(
  new SteamStrategy(
    {
      returnURL: `${BACKEND_URL}/auth/steam/return`,
      realm: BACKEND_URL,
      apiKey: STEAM_API_KEY
    },
    (identifier, profile, done) => {
      profile.identifier = identifier;
      return done(null, profile);
    }
  )
);

// Iniciar login
app.get("/auth/steam", passport.authenticate("steam", { failureRedirect: '/' }));

// Steam devuelve aquí
app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    console.log("🔥 Usuario autenticado:", req.user.id);
    
    const token = jwt.sign(
      {
        id: req.user.id,
        displayName: req.user.displayName,
        avatar: req.user.photos?.[0]?.value,
        profileUrl: req.user._json?.profileurl
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log("🎟️ JWT generado");
    
    res.redirect(`${FRONTEND_URL}/auth-callback?token=${token}`);
  }
);

// =========================
// 👤 Usuario logeado (con JWT)
// =========================
app.get('/api/user', authenticateJWT, (req, res) => {
  console.log("🔍 Usuario verificado:", req.user.displayName || req.user.id);
  res.json(req.user);
});

// =========================
// 🎮 Biblioteca Steam (con JWT)
// =========================
app.get('/api/library', authenticateJWT, async (req, res) => {
  console.log("📚 Solicitando biblioteca para:", req.user.id);

  try {
    const steamID = req.user.id;
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamID}&include_appinfo=true&include_played_free_games=true`;
    
    console.log("🎮 Obteniendo juegos de Steam...");
    const response = await fetch(url);
    const data = await response.json();
    const games = data.response.games || [];
    
    console.log("✅ Juegos obtenidos:", games.length);
    res.json(games);
  } catch (err) {
    console.error("❌ ERROR STEAM:", err);
    res.status(500).json({ error: "Error obteniendo biblioteca de Steam" });
  }
});

// =========================
// 🚪 Logout
// =========================
app.get('/api/logout', (req, res) => {
  res.json({ message: "Elimina el token del localStorage" });
});

// =========================
// 🟣🔥 DEEPSEEK PROXY (CORREGIDO)
// =========================
app.post("/api/deepseek", async (req, res) => {
  try {
    // ✅ Verificar que la API key existe
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("❌ DEEPSEEK_API_KEY no está configurada");
      return res.status(500).json({ error: "API key de DeepSeek no configurada" });
    }

    console.log("🤖 Llamando a DeepSeek API...");

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}` // ✅ CORREGIDO
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: req.body.messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error de DeepSeek:", response.status, errorText);
      return res.status(response.status).json({ 
        error: `DeepSeek API error: ${response.status}` 
      });
    }

    const data = await response.json();
    console.log("✅ Respuesta de DeepSeek recibida");
    res.json(data);
    
  } catch (err) {
    console.error("❌ Error DeepSeek:", err);
    res.status(500).json({ error: "DeepSeek no respondió" });
  }
});
// =========================
// 🏥 Health check
// =========================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =========================
// 🚀 Servidor
// =========================
app.listen(PORT, () => {
  console.log(`
🚀 Servidor corriendo en puerto ${PORT}
📍 Backend URL: ${BACKEND_URL}
🌐 Frontend URL: ${FRONTEND_URL}
🔐 JWT Authentication activado
🤖 DeepSeek Proxy activo (/api/deepseek)
  `);
});
