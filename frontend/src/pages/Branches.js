import React from "react";
import { Link } from "react-router-dom";
import "./Branches.css";

function Branches() {
  return (
    <div className="branches-page">
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Visit Us</div>
          <h1>Our Branches</h1>
          <div className="gold-divider"></div>
          <p>Two conveniently located branches in Sathankulam to serve you better</p>
        </div>
      </div>

      <section className="branches-section">
        <div className="container">
          <div className="branches-grid">
            {/* AC Branch */}
            <div className="branch-card premium">
              <div className="branch-card-header ac-header">
                <div className="branch-type-badge ac-badge">❄️ AC Available — Premium Comfort</div>
                <h2>AC Branch</h2>
                <p className="branch-number">Branch #2</p>
              </div>
              <div className="branch-card-body">
                <div className="branch-detail">
                  <span className="detail-icon">📍</span>
                  <div>
                    <div className="detail-label">Address</div>
                    <div className="detail-value">92/242, Mudalur Road, Sathankulam</div>
                  </div>
                </div>
                <div className="branch-detail">
                  <span className="detail-icon">📞</span>
                  <div>
                    <div className="detail-label">Phone / GPay / PhonePe</div>
                    <div className="detail-value">
                      <a href="tel:9442887267">9442887267</a>
                    </div>
                  </div>
                </div>
                <div className="branch-detail">
                  <span className="detail-icon">🕐</span>
                  <div>
                    <div className="detail-label">Working Hours</div>
                    <div className="detail-value">9:00 AM – 7:00 PM (All days)</div>
                  </div>
                </div>
                <div className="branch-detail">
                  <span className="detail-icon">✨</span>
                  <div>
                    <div className="detail-label">Highlights</div>
                    <div className="detail-value">Air-conditioned comfort, premium ambiance, all services available</div>
                  </div>
                </div>
                <div className="branch-features">
                  {["❄️ Air Conditioned", "✂️ All Services", "💆 Spa & Facial", "💳 Digital Payment", "🧼 Hygienic Tools"].map((f) => (
                    <span key={f} className="branch-feature-tag">{f}</span>
                  ))}
                </div>
              </div>
              <div className="branch-card-footer">
                <Link to="/cart" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Book at This Branch
                </Link>
                <a href={`https://wa.me/919442887267?text=${encodeURIComponent("Hi, I'd like to book at your AC Branch (92/242, Mudalur Road)")}`}
                  target="_blank" rel="noreferrer" className="btn-outline whatsapp-outline">
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* Non-AC Branch */}
            <div className="branch-card standard">
              <div className="branch-card-header nonac-header">
                <div className="branch-type-badge nonac-badge">💪 Budget Comfort</div>
                <h2>Non-AC Branch</h2>
                <p className="branch-number">Branch #1</p>
              </div>
              <div className="branch-card-body">
                <div className="branch-detail">
                  <span className="detail-icon">📍</span>
                  <div>
                    <div className="detail-label">Address</div>
                    <div className="detail-value">92/241, Mudalur Road, Sathankulam</div>
                  </div>
                </div>
                <div className="branch-detail">
                  <span className="detail-icon">📞</span>
                  <div>
                    <div className="detail-label">Phone / GPay / PhonePe</div>
                    <div className="detail-value">
                      <a href="tel:9442887267">9442887267</a>
                    </div>
                  </div>
                </div>
                <div className="branch-detail">
                  <span className="detail-icon">🕐</span>
                  <div>
                    <div className="detail-label">Working Hours</div>
                    <div className="detail-value">9:00 AM – 7:00 PM (All days)</div>
                  </div>
                </div>
                <div className="branch-detail">
                  <span className="detail-icon">✨</span>
                  <div>
                    <div className="detail-label">Highlights</div>
                    <div className="detail-value">Same quality service, great value pricing, friendly atmosphere</div>
                  </div>
                </div>
                <div className="branch-features">
                  {["✂️ All Services", "💈 Classic Cuts", "🪒 Expert Shaving", "💳 Digital Payment", "🧼 Hygienic Tools"].map((f) => (
                    <span key={f} className="branch-feature-tag nonac-tag">{f}</span>
                  ))}
                </div>
              </div>
              <div className="branch-card-footer">
                <Link to="/cart" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Book at This Branch
                </Link>
                <a href={`https://wa.me/919442887267?text=${encodeURIComponent("Hi, I'd like to book at your Non-AC Branch (92/241, Mudalur Road)")}`}
                  target="_blank" rel="noreferrer" className="btn-outline whatsapp-outline">
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Strip */}
      <section className="contact-strip">
        <div className="container">
          <div className="contact-strip-inner">
            <div>
              <h3>Can't decide which branch?</h3>
              <p>Call us and we'll help you pick the best one for your needs</p>
            </div>
            <div className="contact-strip-actions">
              <a href="tel:9442887267" className="btn-primary">📞 Call: 9442887267</a>
              <a href={`https://wa.me/919442887267`} target="_blank" rel="noreferrer" className="btn-outline">💬 WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Branches;
