require('dotenv').config(); // 🔹 cargar variables del .env
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
// 🔐 CORS dinámico
// =========================
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// =========================
// 🍪 SESIÓN
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave_ultrasecreta_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24h
      secure: FRONTEND_URL.startsWith('https://') // true solo en HTTPS
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
      returnURL: `${BACKEND_URL}/auth/steam/return`, // backend
      realm: BACKEND_URL,                           // backend
      apiKey: STEAM_API_KEY
    },
    (identifier, profile, done) => {
      profile.identifier = identifier;
      return done(null, profile);
    }
  )
);

// Iniciar login
app.get("/auth/steam", passport.authenticate("steam"));

// Steam devuelve aquí
app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: `${FRONTEND_URL}/Login` }),
  (req, res) => {
    console.log("🔥 Usuario autenticado:", req.user.id);
    res.redirect(`${FRONTEND_URL}/Library`);
  }
);

// =========================
// 👤 Usuario logeado
// =========================
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "No autenticado" });
  res.json(req.user);
});

// =========================
// 🎮 Biblioteca Steam
// =========================
app.get('/api/library', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "No autenticado" });

  try {
    const steamID = req.user.id;
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamID}&include_appinfo=true&include_played_free_games=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    const games = data.response.games || [];
    
    res.json(games);
  } catch (err) {
    console.error("❌ ERROR STEAM:", err);
    res.status(500).json({ error: "Error obteniendo biblioteca de Steam" });
  }
});

// =========================
// 🚀 Servidor
// =========================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${PORT}`);
});
