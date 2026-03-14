import React, { useEffect, useState } from "react";
import ServiceCard from "../components/ServiceCard";
import "./Services.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "haircut", label: "Hair Cut" },
  { id: "shaving", label: "Shaving" },
  { id: "beard", label: "Beard" },
  { id: "facial", label: "Facial" },
  { id: "massage", label: "Massage" },
  { id: "treatment", label: "Treatment" },
  { id: "spa", label: "Spa" },
  { id: "coloring", label: "Coloring" },
  { id: "combo", label: "Combos" },
];

function Services({ addToCart, cart }) {
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/services`)
      .then((res) => res.json())
      .then((data) => { setServices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "all"
    ? services
    : services.filter((s) => s.category === activeCategory);

  const cartIds = cart ? cart.map((c) => c.id) : [];

  return (
    <div className="services-page">
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Premium Grooming</div>
          <h1>Our Services</h1>
          <div className="gold-divider"></div>
          <p>14 professional services crafted for the modern gentleman</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <div className="container">
          <div className="filter-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`filter-tab ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-section">
        <div className="container">
          {loading ? (
            <div className="services-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="service-skeleton" style={{ height: "220px", borderRadius: "14px", background: "#1a1a1a", animation: "shimmer 1.5s infinite" }}></div>
              ))}
            </div>
          ) : (
            <div className="services-grid-full">
              {filtered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  addToCart={addToCart}
                  inCart={cartIds.includes(service.id)}
                />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="no-services">No services in this category.</div>
          )}
        </div>
      </div>

      {/* Price Note */}
      <div className="price-note">
        <div className="container">
          <div className="price-note-inner">
            <span>💡</span>
            <p>Some services (Facial, Hair Coloring) have a price range depending on the products used. Final price will be confirmed at the salon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Services;
