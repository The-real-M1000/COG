import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-logo">Game Hub</div>
      <div className="navbar-links">
        <Link className="navbar-link" to="/">Home</Link>
        <Link className="navbar-link" to="/library">Library</Link>
        <Link className="navbar-link" to="/favorites">Favorites</Link>
        <Link className="navbar-link" to="/played">Played</Link>
        <Link className="navbar-link" to="/recomendation">Recommendation</Link>
        <Link className="navbar-link" to="/what_to_play">What To Play</Link>
        <Link className="navbar-link" to="/login">Login</Link>
      </div>
    </nav>
  );
}