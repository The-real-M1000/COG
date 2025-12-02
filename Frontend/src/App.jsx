import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Library from "./pages/Library";
import Played from "./pages/Played";
import Recomendation from "./pages/Recommendation";
import WhatToPlay from "./pages/WhatToPlay";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/library" element={<Library />} />
        <Route path="/played" element={<Played />} />
        <Route path="/recomendation" element={<Recomendation />} />
        <Route path="/what_to_play" element={<WhatToPlay />} />
      </Routes>
    </Router>
  );
}

export default App;