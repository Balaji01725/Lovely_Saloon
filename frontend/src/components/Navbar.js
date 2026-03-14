import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ cartCount, loggedIn, userPhone, userRole, onLogout }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navLinks = [
    { path: "/",         label: "Home"     },
    { path: "/about",    label: "About"    },
    { path: "/services", label: "Services" },
    { path: "/branches", label: "Branches" },
    { path: "/contact",  label: "Contact"  },
  ];

  const handleLogout = () => { onLogout(); navigate("/login"); };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-img-wrap">
            <img src="/logo.png" alt="Lovely Mens Beauty Parlour" />
          </div>
          <div className="logo-text">
            <span className="logo-name">Lovely Mens</span>
            <span className="logo-sub">Beauty Parlour</span>
          </div>
        </Link>

        <ul className="nav-links">
          {navLinks.map((l) => (
            <li key={l.path}>
              <Link to={l.path} className={location.pathname === l.path ? "active" : ""}>{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {loggedIn ? (
            <>
              <Link to="/cart" className="cart-btn">
                🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link
                to={userRole === "admin" ? "/admin/dashboard" : "/dashboard"}
                className="btn-outline nav-dash-btn"
              >
                {userRole === "admin" ? "⚙️ Admin" : "👤 My Bookings"}
              </Link>
              <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/cart" className="cart-btn">
                🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/login" className="btn-primary nav-book-btn">Login / Book</Link>
            </>
          )}
        </div>

        <button className={`hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </div>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {navLinks.map((l) => (
          <Link key={l.path} to={l.path} className={location.pathname === l.path ? "active" : ""}>{l.label}</Link>
        ))}
        {loggedIn ? (
          <>
            <Link to={userRole === "admin" ? "/admin/dashboard" : "/dashboard"}>
              {userRole === "admin" ? "⚙️ Admin Panel" : "👤 My Bookings"}
            </Link>
            <Link to="/cart">🛒 Book Now {cartCount > 0 && `(${cartCount})`}</Link>
            <button className="mobile-logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn-primary mobile-book-btn">Login / Book Now</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
