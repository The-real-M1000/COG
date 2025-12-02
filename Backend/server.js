require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

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

// =========================
// 🍪 SESIÓN con configuración cross-domain
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave_ultrasecreta_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24h
      secure: FRONTEND_URL.startsWith('https://'), // true en producción
      httpOnly: true,
      sameSite: FRONTEND_URL.startsWith('https://') ? 'none' : 'lax', // 🔥 CRÍTICO para cross-domain
      domain: BACKEND_URL.includes('onrender.com') ? '.onrender.com' : undefined
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
    console.log("🍪 Sesión creada:", req.sessionID);
    res.redirect(`${FRONTEND_URL}/library`);
  }
);

// =========================
// 👤 Usuario logeado
// =========================
app.get('/api/user', (req, res) => {
  console.log("🔍 Verificando autenticación...");
  console.log("   - Session ID:", req.sessionID);
  console.log("   - Authenticated:", req.isAuthenticated());
  console.log("   - User:", req.user);
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  res.json(req.user);
});

// =========================
// 🎮 Biblioteca Steam
// =========================
app.get('/api/library', async (req, res) => {
  console.log("📚 Solicitando biblioteca...");
  console.log("   - Session ID:", req.sessionID);
  console.log("   - Authenticated:", req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const steamID = req.user.id;
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamID}&include_appinfo=true&include_played_free_games=true`;
    
    console.log("🎮 Obteniendo juegos de Steam para:", steamID);
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
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    res.json({ message: "Sesión cerrada" });
  });
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
🔒 Secure cookies: ${FRONTEND_URL.startsWith('https://')}
  `);
});