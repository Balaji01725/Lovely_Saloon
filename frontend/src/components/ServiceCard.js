import React from "react";
import "./ServiceCard.css";

// Category-based background colors for visual variety
const categoryColors = {
  haircut: "linear-gradient(135deg, #1a1a2e, #16213e)",
  shaving: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
  combo: "linear-gradient(135deg, #1a1a0a, #2a2a15)",
  facial: "linear-gradient(135deg, #1a0a1a, #2a152a)",
  massage: "linear-gradient(135deg, #0a1a1a, #152a2a)",
  beard: "linear-gradient(135deg, #1a100a, #2a1e15)",
  treatment: "linear-gradient(135deg, #0a0a1a, #15152a)",
  spa: "linear-gradient(135deg, #0a1a0a, #152a15)",
  coloring: "linear-gradient(135deg, #1a0a0a, #2a1515)",
  default: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
};

function ServiceCard({ service, addToCart, inCart }) {
  const bg = categoryColors[service.category] || categoryColors.default;

  // Display price range if min != max
  const priceDisplay =
    service.minPrice !== service.maxPrice
      ? `₹${service.minPrice}–₹${service.maxPrice}`
      : `₹${service.price}`;

  return (
    <div className="service-card" style={{ background: bg }}>
      <div className="service-card-icon">{service.icon}</div>
      <div className="service-card-body">
        <h3 className="service-name">{service.name}</h3>
        <p className="service-desc">{service.description}</p>
      </div>
      <div className="service-card-footer">
        <div className="service-price">{priceDisplay}</div>
        <button
          className={`add-cart-btn ${inCart ? "in-cart" : ""}`}
          onClick={() => !inCart && addToCart(service)}
          disabled={inCart}
        >
          {inCart ? "✓ Added" : "+ Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default ServiceCard;
