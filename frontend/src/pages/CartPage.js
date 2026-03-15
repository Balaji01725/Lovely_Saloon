import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h < 19; h++) {
    ["00", "30"].forEach((m) => {
      if (h === 18 && m === "30") return;
      const hr     = h > 12 ? h - 12 : h;
      const period = h >= 12 ? "PM" : "AM";
      slots.push(`${String(hr).padStart(2, "0")}:${m} ${period}`);
    });
  }
  return slots;
}
const ALL_SLOTS = generateTimeSlots();

function CartPage({ cart, removeFromCart, clearCart }) {
  const navigate = useNavigate();

  const [branch,        setBranch]        = useState("");
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("");
  const [customerName,  setCustomerName]  = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading,       setLoading]       = useState(false);
  const [confirmation,  setConfirmation]  = useState(null);
  const [error,         setError]         = useState("");
  const [bookedSlots,   setBookedSlots]   = useState([]);
  const [slotLimit,     setSlotLimit]     = useState(1);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [waClicked,     setWaClicked]     = useState(false);
  const [showConfetti,  setShowConfetti]  = useState(false);

  const total         = cart.reduce((s, i) => s + i.price, 0);
  const today         = new Date().toISOString().split("T")[0];
  const estimatedMins = cart.length * 15;

  // Pre-fill phone from session
  useEffect(() => {
    const ph = localStorage.getItem("lmbp_phone") || "";
    if (ph) setCustomerPhone(ph);
  }, []);

  // Fetch booked slots
  const fetchBookedSlots = useCallback(async () => {
    if (!branch || !date) { setBookedSlots([]); return; }
    setLoadingSlots(true);
    try {
      const res  = await fetch(`${API_URL}/api/bookings/slots?branch=${encodeURIComponent(branch)}&date=${date}`);
      const data = await res.json();
      setBookedSlots(data.bookedSlots || []);
      setSlotLimit(data.slotLimit || 1);
    } catch { setBookedSlots([]); }
    finally { setLoadingSlots(false); }
  }, [branch, date]);

  useEffect(() => { fetchBookedSlots(); setTime(""); }, [fetchBookedSlots]);

  const freeCount = ALL_SLOTS.filter(s => !bookedSlots.includes(s)).length;

  // Submit booking
  const handleBooking = async () => {
    if (!cart.length)         return setError("Please add at least one service.");
    if (!branch)              return setError("Please select a branch.");
    if (!date)                return setError("Please select an appointment date.");
    if (!time)                return setError("Please select a time slot.");
    if (!customerName.trim()) return setError("Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(customerPhone))
      return setError("Please enter a valid 10-digit Indian mobile number.");
    if (bookedSlots.includes(time))
      return setError(`${time} is fully booked. Please choose another slot.`);

    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone, branch, date, time,
          services: cart, total,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmation(data);
        clearCart();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      } else if (data.slotTaken) {
        setError(data.error);
        fetchBookedSlots();
      } else {
        setError("Booking failed. Please call us at 9442887267.");
      }
    } catch {
      setError("Cannot reach server. Please call 9442887267.");
    } finally {
      setLoading(false);
    }
  };

  // Send via WhatsApp
  const handleWhatsApp = () => {
    setWaClicked(true);
    window.open(confirmation.whatsappLink, "_blank");
    setTimeout(() => setWaClicked(false), 3000);
  };

  // ── BOOK ANOTHER — resets form, keeps phone/name, cart already cleared ──
  const handleBookAnother = () => {
    setConfirmation(null);
    setShowConfetti(false);
    setWaClicked(false);
    setBranch("");
    setDate("");
    setTime("");
    setError("");
    setBookedSlots([]);
    // Keep name & phone for convenience
    navigate("/services");
  };

  // ── CONFIRMATION SCREEN ──────────────────────────────────
  if (confirmation) {
    const b = confirmation.booking;
    const services = b.services || [];

    return (
      <div className="cart-page confirm-page">

        {/* Confetti */}
        {showConfetti && (
          <div className="confetti-wrap">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                background: ["#c9a84c","#25d366","#ffffff","#f59e0b","#60a5fa"][Math.floor(Math.random()*5)],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}></div>
            ))}
          </div>
        )}

        <div className="container">
          <div className="confirm-wrap">

            {/* ── Success Icon ── */}
            <div className="confirm-icon-wrap">
              <div className="confirm-ring r1"></div>
              <div className="confirm-ring r2"></div>
              <div className="confirm-circle">
                <span className="confirm-check-emoji">✅</span>
              </div>
            </div>

            <h1 className="confirm-title">Booking Confirmed!</h1>
            <p className="confirm-sub">Your appointment is all set. See you soon at the salon! 💈</p>

            {/* SMS badge */}
            <div className="confirm-sms-badge">
              <span className="sms-badge-dot"></span>
              <span>SMS sent to owner <strong>9442887267</strong> automatically</span>
            </div>

            {/* ── Booking Summary Card ── */}
            <div className="booking-summary-card">
              <div className="bsc-header">
                <div className="bsc-logo">
                  <img src="/logo.png" alt="Logo" />
                </div>
                <div className="bsc-title-wrap">
                  <div className="bsc-salon-name">Lovely Mens Beauty Parlour</div>
                  <div className="bsc-salon-loc">📍 Sathankulam, Tamil Nadu</div>
                </div>
                <div className="bsc-confirmed-badge">✓ CONFIRMED</div>
              </div>

              {/* Dashed divider */}
              <div className="bsc-tear">
                <div className="bsc-tear-circle left"></div>
                <div className="bsc-tear-line"></div>
                <div className="bsc-tear-circle right"></div>
              </div>

              {/* Customer + Date row */}
              <div className="bsc-body">
                <div className="bsc-info-grid">
                  <div className="bsc-info-item">
                    <div className="bsc-info-label">👤 Customer Name</div>
                    <div className="bsc-info-value">{b.customerName}</div>
                  </div>
                  <div className="bsc-info-item">
                    <div className="bsc-info-label">📞 Mobile Number</div>
                    <div className="bsc-info-value">{b.customerPhone}</div>
                  </div>
                  <div className="bsc-info-item">
                    <div className="bsc-info-label">📅 Date</div>
                    <div className="bsc-info-value gold">{b.date}</div>
                  </div>
                  <div className="bsc-info-item">
                    <div className="bsc-info-label">⏰ Time</div>
                    <div className="bsc-info-value gold">{b.time}</div>
                  </div>
                  <div className="bsc-info-item bsc-info-full">
                    <div className="bsc-info-label">🏢 Branch</div>
                    <div className="bsc-info-value">{(b.branch || "").split("—")[0].trim()}</div>
                  </div>
                </div>

                {/* Services list */}
                <div className="bsc-services-section">
                  <div className="bsc-services-title">✂️ Services Booked</div>
                  <div className="bsc-services-list">
                    {services.map((s, i) => (
                      <div key={i} className="bsc-service-row">
                        <span className="bsc-svc-icon">{s.icon || "✂️"}</span>
                        <span className="bsc-svc-name">{s.name}</span>
                        <span className="bsc-svc-price">₹{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total footer */}
              <div className="bsc-footer">
                <div className="bsc-footer-left">
                  <div className="bsc-footer-label">Total Amount</div>
                  <div className="bsc-footer-sub">Pay at shop or online</div>
                </div>
                <div className="bsc-total-amount">₹{b.total}</div>
              </div>
            </div>

            {/* ── WhatsApp CTA ── */}
            <div className="wa-cta-box">
              <div className="wa-cta-header">
                <div className="wa-live-dot"></div>
                <div className="wa-cta-header-text">Send to Owner via WhatsApp</div>
              </div>
              <p className="wa-cta-desc">
                Your booking details are ready to send. One tap sends the full summary directly to owner's WhatsApp.
              </p>

              {/* Message preview */}
              <div className="wa-msg-preview">
                <div className="wa-msg-preview-bar">
                  <span className="wa-preview-dot"></span>
                  <span className="wa-preview-dot"></span>
                  <span className="wa-preview-dot"></span>
                  <span className="wa-preview-label">Message Preview</span>
                </div>
                <div className="wa-msg-bubble">
                  <div className="wa-msg-line"><strong>New Booking — Lovely Mens Beauty Parlour</strong></div>
                  <div className="wa-msg-line">Customer: {b.customerName}</div>
                  <div className="wa-msg-line">Phone: {b.customerPhone}</div>
                  <div className="wa-msg-line">Branch: {(b.branch||"").split("—")[0].trim()}</div>
                  <div className="wa-msg-line">Services: {services.map(s=>s.name).join(", ")}</div>
                  <div className="wa-msg-line">Total: ₹{b.total}</div>
                  <div className="wa-msg-line">Date: {b.date} at {b.time}</div>
                  <div className="wa-msg-tick">✓✓</div>
                </div>
              </div>

              <button
                className={`wa-send-btn ${waClicked ? "wa-clicked" : ""}`}
                onClick={handleWhatsApp}
              >
                <span className="wa-btn-inner">
                  {waClicked ? (
                    <>
                      <span className="wa-sent-check">✓</span>
                      <span>Opening WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <svg className="wa-svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                      </svg>
                      <span>Send Booking via WhatsApp</span>
                      <span className="wa-arrow">→</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* ── Payment ── */}
            <div className="confirm-pay-section">
              <div className="cps-title">💳 Pay Online (Optional)</div>
              <div className="cps-cards">
                <div className="cps-card gpay-card">
                  <div className="cps-logo gpay-logo">G Pay</div>
                  <div className="cps-num">9442887267</div>
                </div>
                <div className="cps-card phonepe-card">
                  <div className="cps-logo phonepe-logo">PhonePe</div>
                  <div className="cps-num">9442887267</div>
                </div>
              </div>
              <p className="cps-note">💡 Cash accepted at the shop · Pay after your visit</p>
            </div>

            {/* ── Action Buttons ── */}
            <div className="confirm-actions">
              {/* BOOK ANOTHER — most prominent */}
              <button className="book-another-btn" onClick={handleBookAnother}>
                <span>✂️</span>
                <span>Book Another Appointment</span>
              </button>

              <div className="confirm-secondary-btns">
                <Link to="/dashboard" className="btn-outline confirm-sec-btn">
                  📋 My Bookings
                </Link>
                <Link to="/" className="btn-outline confirm-sec-btn">
                  🏠 Home
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── MAIN CART PAGE ────────────────────────────────────────
  return (
    <div className="cart-page">
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Your Selection</div>
          <h1>Book Appointment</h1>
          <div className="gold-divider"></div>
          <p className="page-header-sub">Premium grooming — booked in minutes</p>
        </div>
      </div>

      <div className="cart-layout container">

        {/* ── LEFT: Cart ── */}
        <div className="cart-left">
          <h2 className="cart-section-title">🛒 Selected Services</h2>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">✂️</div>
              <h3>Your cart is empty</h3>
              <p>Add services to get started</p>
              <Link to="/services" className="btn-primary" style={{ marginTop:"16px" }}>
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <span className="ci-icon">{item.icon}</span>
                  <div className="ci-info">
                    <div className="ci-name">{item.name}</div>
                    <div className="ci-desc">{item.description}</div>
                  </div>
                  <div className="ci-price">₹{item.price}</div>
                  <button className="ci-remove" onClick={() => removeFromCart(item.id)} title="Remove">✕</button>
                </div>
              ))}

              <div className="cart-total-bar">
                <div className="ctb-left">
                  <div className="ctb-label">Total Amount</div>
                  <div className="ctb-sub">{cart.length} service{cart.length>1?"s":""} · ~{estimatedMins} min</div>
                </div>
                <div className="ctb-amount">₹{total}</div>
              </div>
            </div>
          )}

          {/* Availability card */}
          {branch && date && (
            <div className="avail-card">
              <div className="avail-card-header">
                <span>📅</span>
                <span>{slotLimit===1 ? "AC Branch — 1 slot per time" : "Non-AC — 2 slots per time"}</span>
              </div>
              {loadingSlots ? (
                <div className="avail-loading">⏳ Checking availability...</div>
              ) : (
                <>
                  <div className="avail-row">
                    <div className="avail-stat">
                      <div className="avail-num free">{freeCount}</div>
                      <div className="avail-lbl">Available</div>
                    </div>
                    <div className="avail-divider"></div>
                    <div className="avail-stat">
                      <div className="avail-num taken">{bookedSlots.length}</div>
                      <div className="avail-lbl">Booked</div>
                    </div>
                    <div className="avail-divider"></div>
                    <div className="avail-stat">
                      <div className="avail-num all">{ALL_SLOTS.length}</div>
                      <div className="avail-lbl">Total Slots</div>
                    </div>
                  </div>
                  {freeCount > 0 && freeCount <= 3 && (
                    <div className="avail-warn">⚡ Only {freeCount} slots left — book now!</div>
                  )}
                  {freeCount === 0 && (
                    <div className="avail-full">😔 All slots booked. Please choose another date.</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="cart-right">
          <h2 className="cart-section-title">📅 Appointment Details</h2>

          {error && (
            <div className="form-error-box">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="booking-form">

            <div className="form-field">
              <label>Select Branch *</label>
              <select value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="">— Choose a Branch —</option>
                <option value="AC Branch — 92/242, Mudalur Road, Sathankulam">
                  ❄️ AC Branch — 92/242, Mudalur Road (1 booking/slot)
                </option>
                <option value="Non-AC Branch — 92/241, Mudalur Road, Sathankulam">
                  💪 Non-AC Branch — 92/241, Mudalur Road (2 bookings/slot)
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>Appointment Date *</label>
              <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="form-field">
              <label>
                Select Time Slot *
                {loadingSlots && <span className="loading-txt"> ⏳ checking...</span>}
              </label>
              {!branch || !date ? (
                <div className="slot-placeholder">👆 Select branch and date first</div>
              ) : (
                <>
                  <div className="time-slots-grid">
                    {ALL_SLOTS.map(slot => {
                      const booked   = bookedSlots.includes(slot);
                      const selected = time === slot;
                      return (
                        <button key={slot} type="button"
                          className={`slot-btn ${booked?"slot-booked":""} ${selected?"slot-selected":""}`}
                          onClick={() => !booked && setTime(slot)}
                          disabled={booked}
                        >
                          <span className="slot-time">{slot}</span>
                          {booked && <span className="slot-full-tag">Full</span>}
                          {selected && <span className="slot-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="slot-legend">
                    <span><span className="leg-dot free"></span>Available</span>
                    <span><span className="leg-dot selected"></span>Selected</span>
                    <span><span className="leg-dot booked"></span>Fully Booked</span>
                  </div>
                </>
              )}
            </div>

            <div className="form-field">
              <label>Your Full Name *</label>
              <input type="text" placeholder="Enter your full name"
                value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>

            <div className="form-field">
              <label>Mobile Number *</label>
              <div className="phone-field-wrap">
                <span className="phone-prefix-small">+91</span>
                <input type="tel" placeholder="10-digit number"
                  value={customerPhone} maxLength={10}
                  onChange={e => setCustomerPhone(e.target.value.replace(/\D/,"").slice(0,10))} />
                {customerPhone.length===10 && <span className="phone-ok">✅</span>}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="booking-mini-summary">
                <div className="bms-row"><span>Services</span><span>{cart.length} selected</span></div>
                <div className="bms-row"><span>Duration</span><span>~{estimatedMins} mins</span></div>
                <div className="bms-row bms-total"><span>Total</span><span>₹{total}</span></div>
              </div>
            )}

            <button
              className="confirm-book-btn"
              onClick={handleBooking}
              disabled={loading || cart.length === 0}
            >
              {loading ? (
                <span className="btn-loading-inner">
                  <span className="btn-spinner-sm"></span>
                  Confirming Booking...
                </span>
              ) : (
                <span>✅ Confirm Booking</span>
              )}
            </button>

            <div className="form-bottom-note">
              <span>📱</span>
              <span>SMS sent to owner automatically · WhatsApp option after confirmation</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default CartPage;
