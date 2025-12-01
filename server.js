const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 5000;
const STEAM_API_KEY = "A9E487A997DC96F49F79FDB187B809EF";

// =========================
// 🔐 CORS
// =========================
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// =========================
// 🍪 SESIÓN (LA CORRECTA PARA PASSPORT)
// =========================
app.use(
  session({
    secret: "clave_ultrasecreta_que_tu_cambias",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24h
      secure: false // en localhost debe ser false
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
      returnURL: "http://localhost:5000/auth/steam/return",
      realm: "http://localhost:5000/",
      apiKey: STEAM_API_KEY
    },
    function (identifier, profile, done) {
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
  passport.authenticate("steam", { failureRedirect: "http://localhost:3000/Login" }),
  (req, res) => {
    console.log("🔥 Usuario autenticado:", req.user.id);
    res.redirect("http://localhost:3000/Library");
  }
);

// =========================
// 👤 Usuario logeado
// =========================
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  res.json(req.user);
});

// =========================
// 🎮 Biblioteca Steam
// =========================
app.get('/api/library', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const steamID = req.user.id;
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamID}&include_appinfo=true&include_played_free_games=true`;
    
    console.log("🌐 Consultando Steam:", url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Aquí está el error: la API devuelve directamente los datos en data.response.games
    // No necesitas mapear, solo devuelves lo que Steam te da
    const games = data.response.games || [];
    
    console.log("✅ Juegos obtenidos:", games.length);
    
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
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});