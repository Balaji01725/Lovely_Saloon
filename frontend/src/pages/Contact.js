import React from "react";
import "./Contact.css";

function Contact() {
  return (
    <div className="contact-page">
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Get In Touch</div>
          <h1>Contact Us</h1>
          <div className="gold-divider"></div>
          <p>We're always happy to hear from you</p>
        </div>
      </div>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Cards */}
            <div className="contact-cards">
              {[
                { icon: "📞", title: "Call Us", lines: ["9442887267", "Available 9 AM – 7 PM"], action: "tel:9442887267", actionLabel: "Call Now" },
                { icon: "💬", title: "WhatsApp", lines: ["9442887267", "Quick booking & queries"], action: `https://wa.me/919442887261`, actionLabel: "Chat on WhatsApp" },
                { icon: "💳", title: "GPay / PhonePe", lines: ["9442887267", "Quick digital payments"], action: null, actionLabel: null },
              ].map((c, i) => (
                <div key={i} className="contact-card gold-card">
                  <div className="contact-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  {c.lines.map((l, j) => (
                    <p key={j} className={j === 0 ? "contact-main" : "contact-sub"}>{l}</p>
                  ))}
                  {c.action && (
                    <a href={c.action} target="_blank" rel="noreferrer" className="btn-outline contact-action-btn">
                      {c.actionLabel}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Branch Info */}
            <div className="contact-branches">
              <h2>Our Locations</h2>
              <div className="gold-divider" style={{ margin: "14px 0" }}></div>
              <div className="location-card">
                <div className="location-badge ac">❄️ AC Branch</div>
                <h3>92/242, Mudalur Road</h3>
                <p>Sathankulam, Tamil Nadu</p>
                <a href="https://maps.google.com/?q=Sathankulam,Tamil+Nadu" target="_blank" rel="noreferrer" className="map-link">📍 View on Maps</a>
              </div>
              <div className="location-card" style={{ marginTop: "20px" }}>
                <div className="location-badge nonac">💪 Non-AC Branch</div>
                <h3>92/241, Mudalur Road</h3>
                <p>Sathankulam, Tamil Nadu</p>
                <a href="https://maps.google.com/?q=Sathankulam,Tamil+Nadu" target="_blank" rel="noreferrer" className="map-link">📍 View on Maps</a>
              </div>

              <div className="hours-box">
                <h4>🕐 Working Hours</h4>
                <div className="hours-row"><span>Monday – Sunday</span><span className="hours-time">9:00 AM – 7:00 PM</span></div>
                <div className="hours-row"><span>Public Holidays</span><span className="hours-time">Usually Open</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
