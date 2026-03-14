import React from "react";
import "./About.css";

function About() {
  const milestones = [
    { year: "1999", event: "Lovely Mens Beauty Parlour founded by Maharajan R in Sathankulam" },
    { year: "2005", event: "Expanded services to include professional facial and hair treatments" },
    { year: "2012", event: "Opened the Non-AC branch at 92/241, Mudalur Road" },
    { year: "2018", event: "Launched the Premium AC Branch at 92/242, Mudalur Road" },
    { year: "2024", event: "25 years of excellence — still going strong with loyal clientele" },
  ];

  return (
    <div className="about-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Our Story</div>
          <h1>About Lovely Mens Beauty Parlour</h1>
          <div className="gold-divider"></div>
          <p>A legacy of trust, skill, and premium grooming for the modern gentleman</p>
        </div>
      </div>

      {/* Owner Section */}
      <section className="about-owner">
        <div className="container">
          <div className="about-owner-inner">
            <div className="about-img-wrap">
              <img
                src="/owner.png"
                alt="Maharajan R — Founder"
                className="about-owner-photo"
              />
              <div className="about-owner-experience">
                <div className="exp-number">25+</div>
                <div className="exp-text">Years of<br />Excellence</div>
              </div>
            </div>
            <div className="about-owner-text">
              <div className="gold-badge">Founder & Owner</div>
              <h2>Maharajan R</h2>
              <div className="gold-divider" style={{ margin: "14px 0" }}></div>
              <p>
                Maharajan R began his grooming journey over <strong>25 years ago</strong> with a simple mission — to give every man in Sathankulam access to professional, hygienic, and stylish grooming at an affordable price.
              </p>
              <p style={{ marginTop: "14px" }}>
                Starting with humble beginnings, his dedication to his craft and his customers quickly earned him a reputation that spread across the community. Today, with <strong>two branches</strong> on Mudalur Road, Lovely Mens Beauty Parlour is a household name for men who take their appearance seriously.
              </p>
              <p style={{ marginTop: "14px" }}>
                His personal philosophy: <em style={{ color: "#c9a84c" }}>"Every man deserves to look and feel his best — regardless of budget."</em>
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-num">25+</div>
                  <div className="stat-label">Years Experience</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">2</div>
                  <div className="stat-label">Branches</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">14+</div>
                  <div className="stat-label">Services</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">1000s</div>
                  <div className="stat-label">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header">
            <div className="gold-badge">Our Journey</div>
            <h2>Milestones & Legacy</h2>
            <div className="gold-divider"></div>
          </div>
          <div className="timeline">
            {milestones.map((m, i) => (
              <div className={`timeline-item ${i % 2 === 0 ? "left" : "right"}`} key={i}>
                <div className="timeline-year">{m.year}</div>
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <p>{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <div className="gold-badge">What We Stand For</div>
            <h2>Our Core Values</h2>
            <div className="gold-divider"></div>
          </div>
          <div className="values-grid">
            {[
              { icon: "🎯", title: "Precision", desc: "Every cut, every shave is done with professional precision and attention to detail." },
              { icon: "🧼", title: "Hygiene", desc: "We follow strict hygiene protocols — clean tools, clean space, every single customer." },
              { icon: "💛", title: "Customer First", desc: "Your satisfaction is our success. We listen, we adapt, we deliver." },
              { icon: "💰", title: "Fair Pricing", desc: "Premium quality grooming doesn't have to break the bank. We keep prices honest." },
            ].map((v, i) => (
              <div className="value-card gold-card" key={i}>
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
