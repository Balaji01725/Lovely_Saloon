import React from "react";
import { Link } from "react-router-dom";
import "./Contact.css";

export default function Contact() {
  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="container">
          <div className="gold-badge">Get In Touch</div>
          <h1>Contact Us</h1>
          <div className="gold-divider"></div>
          <p className="contact-hero-sub">We're always happy to hear from you</p>
        </div>
      </div>

      <div className="container contact-grid">
        {/* LEFT */}
        <div className="contact-cards-col">
          <div className="contact-card">
            <div className="cc-icon-wrap phone-bg"><span className="cc-icon">📞</span></div>
            <div className="cc-body">
              <div className="cc-title">Call Us</div>
              <div className="cc-main">9442887267</div>
              <div className="cc-sub">Available 9:00 AM – 7:00 PM · All days</div>
              <a href="tel:9442887267" className="cc-action-btn gold-btn">📞 Call Now</a>
            </div>
          </div>

          <div className="contact-card">
            <div className="cc-icon-wrap wa-bg"><span className="cc-icon">💬</span></div>
            <div className="cc-body">
              <div className="cc-title">WhatsApp</div>
              <div className="cc-main">9442887267</div>
              <div className="cc-sub">Quick bookings, queries & confirmations</div>
              <a href="https://wa.me/919442887267" target="_blank" rel="noreferrer" className="cc-action-btn wa-btn">💬 Chat on WhatsApp</a>
            </div>
          </div>

          <div className="contact-card">
            <div className="cc-icon-wrap pay-bg"><span className="cc-icon">💳</span></div>
            <div className="cc-body">
              <div className="cc-title">GPay / PhonePe</div>
              <div className="cc-main">9442887267</div>
              <div className="cc-sub">Quick digital payments accepted</div>
              <div className="cc-pay-row">
                <span className="cc-gpay">G Pay</span>
                <span className="cc-phonepe">PhonePe</span>
              </div>
            </div>
          </div>

          <div className="contact-cta-card">
            <h3>Ready to Book?</h3>
            <p>Book your appointment online in minutes</p>
            <Link to="/cart" className="btn-primary" style={{marginTop:"16px",width:"100%",justifyContent:"center"}}>
              📅 Book Appointment Now
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="contact-info-col">
          <h2 className="contact-section-h2">Our Locations</h2>
          <div className="gold-divider" style={{margin:"12px 0 24px"}}></div>

          <div className="location-card ac-loc">
            <div className="loc-badge ac">❄️ AC Branch — Premium Comfort</div>
            <h3 className="loc-name">Branch #2 — AC Branch</h3>
            <div className="loc-rows">
              <div className="loc-row"><span>📍</span><span>92/242, Mudalur Road, Sathankulam</span></div>
              <div className="loc-row"><span>📞</span><a href="tel:9442887267" className="loc-link">9442887267</a></div>
              <div className="loc-row"><span>🕐</span><span>9:00 AM – 7:00 PM (All days)</span></div>
              <div className="loc-row"><span>✨</span><span>Air-conditioned · All services available</span></div>
            </div>
            <div className="loc-tags">
              <span className="loc-tag ac-tag">❄️ Air Conditioned</span>
              <span className="loc-tag ac-tag">✂️ All Services</span>
              <span className="loc-tag ac-tag">💳 Digital Pay</span>
            </div>
            <a href="https://maps.google.com/?q=Sathankulam+Tamil+Nadu" target="_blank" rel="noreferrer" className="loc-map-link">📍 View on Google Maps</a>
          </div>

          <div className="location-card nonac-loc">
            <div className="loc-badge nonac">💪 Non-AC Branch — Budget Comfort</div>
            <h3 className="loc-name">Branch #1 — Non-AC Branch</h3>
            <div className="loc-rows">
              <div className="loc-row"><span>📍</span><span>92/241, Mudalur Road, Sathankulam</span></div>
              <div className="loc-row"><span>📞</span><a href="tel:9442887267" className="loc-link">9442887267</a></div>
              <div className="loc-row"><span>🕐</span><span>9:00 AM – 7:00 PM (All days)</span></div>
              <div className="loc-row"><span>✨</span><span>Same quality · Great value pricing</span></div>
            </div>
            <div className="loc-tags">
              <span className="loc-tag gold-tag">✂️ All Services</span>
              <span className="loc-tag gold-tag">💈 Classic Cuts</span>
              <span className="loc-tag gold-tag">💳 Digital Pay</span>
            </div>
            <a href="https://maps.google.com/?q=Sathankulam+Tamil+Nadu" target="_blank" rel="noreferrer" className="loc-map-link">📍 View on Google Maps</a>
          </div>

          <div className="hours-box">
            <h4 className="hours-box-title">🕐 Working Hours</h4>
            <div className="hours-list">
              <div className="hours-row"><span>Monday – Friday</span><span className="h-time">9:00 AM – 7:00 PM</span></div>
              <div className="hours-row"><span>Saturday – Sunday</span><span className="h-time">9:00 AM – 7:00 PM</span></div>
              <div className="hours-row"><span>Public Holidays</span><span className="h-time h-open">Usually Open ✓</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
