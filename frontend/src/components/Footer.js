import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Column */}
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-img">
                  <img src="/logo.png" alt="Lovely Mens Beauty Parlour" />
                </div>
                <div>
                  <div className="footer-logo-name">Lovely Mens</div>
                  <div className="footer-logo-sub">Beauty Parlour</div>
                </div>
              </div>
              <p className="footer-tagline">
                Premium men's grooming experience with <strong>25+ years</strong> of trusted service in Sathankulam.
              </p>
              <div className="footer-social">
                <a href={`https://wa.me/919442887267`} target="_blank" rel="noreferrer" className="social-btn whatsapp-btn">
                  💬 WhatsApp Us
                </a>
                <a href="tel:9442887267" className="social-btn call-btn">
                  📞 Call Now
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/branches">Branches</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/admin">Admin Login</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div className="footer-col">
              <h4>Our Services</h4>
              <ul>
                <li>Hair Cut & Styling</li>
                <li>Shaving & Beard</li>
                <li>Facial for Gents</li>
                <li>Head & Face Massage</li>
                <li>Hair Straightening</li>
                <li>Hair Coloring & Spa</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-col">
              <h4>Contact Us</h4>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <span>📞</span>
                  <span>9442887267</span>
                </div>
                <div className="footer-contact-item">
                  <span>📍</span>
                  <span>Non-AC: 92/241, Mudalur Road, Sathankulam</span>
                </div>
                <div className="footer-contact-item">
                  <span>❄️</span>
                  <span>AC: 92/242, Mudalur Road, Sathankulam</span>
                </div>
                <div className="footer-contact-item">
                  <span>🕐</span>
                  <span>Open: 9:00 AM – 7:00 PM</span>
                </div>
              </div>
              <div className="payment-logos">
                <span className="pay-badge gpay">G Pay</span>
                <span className="pay-badge phonepe">PhonePe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} Lovely Mens Beauty Parlour. All rights reserved. Owned by <strong>Maharajan R</strong></p>
          <p className="footer-bottom-right">Crafted with ✦ for premium grooming</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
