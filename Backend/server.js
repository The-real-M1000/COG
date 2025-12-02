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
      maxAge: 10 * 60 * 1000, // Solo 10 minutos para el flujo de autenticación
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

  const token = authHeader.substring(7); // Remover 'Bearer '
  
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
    
    // Crear JWT con la info del usuario
    const token = jwt.sign(
      {
        id: req.user.id,
        displayName: req.user.displayName,
        avatar: req.user.photos?.[0]?.value,
        profileUrl: req.user._json?.profileurl
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token válido por 7 días
    );
    
    console.log("🎟️ JWT generado");
    
    // Redirigir al frontend con el token en la URL
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
  // Con JWT, el logout es del lado del cliente (eliminar el token)
  res.json({ message: "Elimina el token del localStorage" });
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
  `);
});