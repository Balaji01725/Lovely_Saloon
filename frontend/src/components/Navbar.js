/* ============================================
   Navbar Component
   ============================================ */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar({ cartCount }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Add shadow when user scrolls down
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/services", label: "Services" },
    { path: "/branches", label: "Branches" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-img-wrap">
            {/* Black Elegant Beauty Logo — white butterfly on black background */}
            <img
              src="/logo.png"
              alt="Lovely Mens Beauty Parlour"
            />
          </div>
          <div className="logo-text">
            <span className="logo-name">Lovely Mens</span>
            <span className="logo-sub">Beauty Parlour</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={location.pathname === link.path ? "active" : ""}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Cart + CTA */}
        <div className="nav-actions">
          <Link to="/cart" className="cart-btn">
            <span className="cart-icon">🛒</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <Link to="/cart" className="btn-primary nav-book-btn">
            Book Now
          </Link>
        </div>

        {/* Hamburger for mobile */}
        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
        <Link to="/cart" className="btn-primary mobile-book-btn">
          🛒 Book Now {cartCount > 0 && `(${cartCount})`}
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
