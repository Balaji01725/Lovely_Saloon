import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import "./Home.css";

// API URL — change to your deployed backend URL if needed
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Home({ addToCart }) {
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch services from backend
  useEffect(() => {
    fetch(`${API_URL}/api/services`)
      .then((res) => res.json())
      .then((data) => setServices(data.slice(0, 6))) // Show only first 6 on home
      .catch((err) => console.error("Failed to load services:", err));
  }, []);

  const handleAddToCart = (service) => {
    addToCart(service);
    setCart((prev) => [...prev, service.id]);
  };

  const features = [
    { icon: "🏆", title: "25+ Years", desc: "Trusted Experience" },
    { icon: "✂️", title: "Expert Cuts", desc: "Precision Grooming" },
    { icon: "❄️", title: "AC Branch", desc: "Premium Comfort" },
    { icon: "💳", title: "Easy Pay", desc: "GPay & PhonePe" },
    { icon: "📅", title: "Book Online", desc: "Quick Appointment" },
    { icon: "🌿", title: "Quality Products", desc: "Premium Care" },
  ];

  return (
    <div className="home">
      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-overlay"></div>
          {/* Decorative gold lines */}
          <div className="hero-deco-line hero-deco-left"></div>
          <div className="hero-deco-line hero-deco-right"></div>
        </div>
        <div className="hero-content container">
          <div className="hero-badge gold-badge">Est. Since 1999 · Sathankulam</div>
          <h1 className="hero-title">
            <span className="hero-title-sub">Lovely Mens</span>
            <span className="hero-title-main">Beauty Parlour</span>
          </h1>
          <div className="gold-divider"></div>
          <p className="hero-tagline">
            Stylish Grooming for Modern Men —<br />
            <strong>25+ Years of Trusted Service</strong>
          </p>
          <div className="hero-cta">
            <Link to="/cart" className="btn-primary">
              📅 Book Now
            </Link>
            <Link to="/services" className="btn-outline">
              ✂️ View Services
            </Link>
          </div>
          <div className="hero-contact">
            <a href="tel:9442887267" className="hero-phone">
              📞 9442887267
            </a>
            <span className="hero-divider-dot">·</span>
            <a href={`https://wa.me/919442887267`} target="_blank" rel="noreferrer" className="hero-whatsapp">
              💬 WhatsApp Us
            </a>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <span></span>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-item" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OWNER TEASER ===== */}
      <section className="owner-section">
        <div className="container">
          <div className="owner-inner">
            <div className="owner-img-wrap">
              {/* Place father.png in frontend/src/assets/ and copy to public/owner.png */}
              <img
                src="/owner.png"
                alt="Maharajan R — Founder & Owner"
                className="owner-photo"
              />
              <div className="owner-badge-ring"></div>
            </div>
            <div className="owner-text">
              <div className="gold-badge">Our Founder</div>
              <h2>Maharajan R</h2>
              <div className="gold-divider" style={{ margin: "12px 0" }}></div>
              <p className="owner-subtitle">Founder & Owner · 25+ Years of Expert Grooming</p>
              <p className="owner-bio">
                With over <strong>25 years of professional grooming experience</strong>, Maharajan R has built Lovely Mens Beauty Parlour into one of Sathankulam's most trusted names in men's styling. His dedication to quality, hygiene, and customer satisfaction has earned him a loyal clientele that spans generations.
              </p>
              <Link to="/about" className="btn-outline" style={{ marginTop: "20px" }}>
                Read Our Story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES PREVIEW ===== */}
      <section className="services-preview">
        <div className="container">
          <div className="section-header">
            <div className="gold-badge">What We Offer</div>
            <h2>Our Signature Services</h2>
            <div className="gold-divider"></div>
            <p>From classic cuts to premium spa treatments — every service crafted for the modern gentleman</p>
          </div>
          <div className="services-grid">
            {services.length > 0 ? (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  addToCart={handleAddToCart}
                  inCart={cart.includes(service.id)}
                />
              ))
            ) : (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="service-skeleton"></div>
              ))
            )}
          </div>
          <div className="view-all-wrap">
            <Link to="/services" className="btn-primary">
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BRANCHES TEASER ===== */}
      <section className="branches-teaser">
        <div className="container">
          <div className="section-header">
            <div className="gold-badge">Visit Us</div>
            <h2>Two Convenient Branches</h2>
            <div className="gold-divider"></div>
          </div>
          <div className="branch-cards">
            <div className="branch-teaser-card">
              <div className="branch-badge ac">❄️ AC Available</div>
              <h3>AC Branch</h3>
              <p>92/242, Mudalur Road, Sathankulam</p>
              <p className="branch-premium">Premium air-conditioned comfort</p>
            </div>
            <div className="branch-teaser-card">
              <div className="branch-badge nonac">💪 Budget Comfort</div>
              <h3>Non-AC Branch</h3>
              <p>92/241, Mudalur Road, Sathankulam</p>
              <p className="branch-premium">Same quality, great value</p>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <Link to="/branches" className="btn-outline">See Branch Details →</Link>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-inner">
            <h2>Ready for a Fresh New Look?</h2>
            <p>Book your appointment online and walk in at your preferred time slot</p>
            <div className="cta-btns">
              <Link to="/cart" className="btn-primary">Book Appointment Now</Link>
              <a href="tel:9442887267" className="btn-outline">Call: 9442887267</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
