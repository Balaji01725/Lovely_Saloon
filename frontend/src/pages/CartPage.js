import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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

  const total         = cart.reduce((sum, i) => sum + i.price, 0);
  const today         = new Date().toISOString().split("T")[0];
  const estimatedMins = cart.length * 15;

  useEffect(() => {
    const ph = localStorage.getItem("lmbp_phone") || "";
    if (ph) setCustomerPhone(ph);
  }, []);

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

  const freeCount = ALL_SLOTS.filter((s) => !bookedSlots.includes(s)).length;

  const handleBooking = async () => {
    if (cart.length === 0)    return setError("Please add at least one service.");
    if (!branch)              return setError("Please select a branch.");
    if (!date)                return setError("Please select a date.");
    if (!time)                return setError("Please select a time slot.");
    if (!customerName.trim()) return setError("Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(customerPhone))
      return setError("Please enter a valid 10-digit Indian mobile number.");
    if (bookedSlots.includes(time))
      return setError(`${time} is fully booked. Choose another slot.`);

    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/bookings`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: customerName.trim(), customerPhone, branch, date, time, services: cart, total }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmation(data);
        clearCart();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      } else if (data.slotTaken) {
        setError(data.error); fetchBookedSlots();
      } else {
        setError("Booking failed. Please call 9442887267.");
      }
    } catch { setError("Cannot reach server. Call 9442887267 or use WhatsApp."); }
    finally { setLoading(false); }
  };

  const handleWhatsApp = () => {
    setWaClicked(true);
    window.open(confirmation.whatsappLink, "_blank");
    setTimeout(() => setWaClicked(false), 3000);
  };

  // ── CONFIRMATION SCREEN ──────────────────────────────────
  if (confirmation) {
    const svcList = (confirmation.booking.services || []).map(s => `${s.name} (₹${s.price})`).join(", ");
    return (
      <div className="cart-page confirm-page">
        {/* Confetti particles */}
        {showConfetti && (
          <div className="confetti-wrap">
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random()*100}%`,
                animationDelay: `${Math.random()*2}s`,
                background: i % 3 === 0 ? "#c9a84c" : i % 3 === 1 ? "#25d366" : "#ffffff",
              }}></div>
            ))}
          </div>
        )}

        <div className="container">
          <div className="confirm-wrap">

            {/* Success icon */}
            <div className="confirm-icon-wrap">
              <div className="confirm-icon-ring ring1"></div>
              <div className="confirm-icon-ring ring2"></div>
              <div className="confirm-icon-circle">
                <span className="confirm-icon">✅</span>
              </div>
            </div>

            <h1 className="confirm-title">Booking Confirmed!</h1>
            <p className="confirm-tagline">Your appointment is all set. See you soon! 💈</p>

            {/* SMS notice */}
            <div className="confirm-sms-badge">
              <span>📱</span>
              <span>SMS sent to owner <strong>9442887267</strong> automatically</span>
            </div>

            {/* Booking ticket card */}
            <div className="booking-ticket">
              <div className="ticket-top">
                <div className="ticket-logo">
                  <img src="/logo.png" alt="Logo" />
                </div>
                <div className="ticket-salon">
                  <div className="ticket-salon-name">Lovely Mens Beauty Parlour</div>
                  <div className="ticket-salon-loc">Sathankulam, Tamil Nadu</div>
                </div>
                <div className="ticket-badge-confirmed">✓ CONFIRMED</div>
              </div>

              <div className="ticket-divider">
                <div className="ticket-divider-circle left"></div>
                <div className="ticket-divider-line"></div>
                <div className="ticket-divider-circle right"></div>
              </div>

              <div className="ticket-body">
                <div className="ticket-row">
                  <div className="ticket-field">
                    <div className="ticket-field-label">👤 Customer</div>
                    <div className="ticket-field-value">{confirmation.booking.customerName}</div>
                  </div>
                  <div className="ticket-field">
                    <div className="ticket-field-label">📞 Phone</div>
                    <div className="ticket-field-value">{confirmation.booking.customerPhone}</div>
                  </div>
                </div>
                <div className="ticket-row">
                  <div className="ticket-field">
                    <div className="ticket-field-label">📅 Date</div>
                    <div className="ticket-field-value highlight">{confirmation.booking.date}</div>
                  </div>
                  <div className="ticket-field">
                    <div className="ticket-field-label">⏰ Time</div>
                    <div className="ticket-field-value highlight">{confirmation.booking.time}</div>
                  </div>
                </div>
                <div className="ticket-row">
                  <div className="ticket-field ticket-field-full">
                    <div className="ticket-field-label">🏢 Branch</div>
                    <div className="ticket-field-value">{(confirmation.booking.branch || "").split("—")[0].trim()}</div>
                  </div>
                </div>
                <div className="ticket-row">
                  <div className="ticket-field ticket-field-full">
                    <div className="ticket-field-label">✂️ Services</div>
                    <div className="ticket-services-tags">
                      {(confirmation.booking.services || []).map((s, i) => (
                        <span key={i} className="ticket-svc-tag">{s.name} — ₹{s.price}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ticket-footer">
                <div className="ticket-total-label">Total Amount</div>
                <div className="ticket-total-amount">₹{confirmation.booking.total}</div>
              </div>
            </div>

            {/* WhatsApp CTA — animated, prominent */}
            <div className="wa-cta-section">
              <div className="wa-cta-label">
                <div className="wa-pulse-dot"></div>
                Also notify the owner via WhatsApp
              </div>
              <p className="wa-cta-sub">
                Your booking is saved. Send a WhatsApp message too so the owner has it on chat.
              </p>
              <button
                className={`wa-send-btn ${waClicked ? "wa-sent" : ""}`}
                onClick={handleWhatsApp}
              >
                {waClicked ? (
                  <span className="wa-btn-content">
                    <span className="wa-check-icon">✓</span>
                    Opening WhatsApp...
                  </span>
                ) : (
                  <span className="wa-btn-content">
                    <span className="wa-icon-wrap">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="wa-icon-svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                      </svg>
                    </span>
                    Send via WhatsApp
                  </span>
                )}
              </button>
            </div>

            {/* Payment */}
            <div className="confirm-payment">
              <div className="confirm-payment-title">💳 Payment Options</div>
              <div className="confirm-pay-cards">
                <div className="confirm-pay-card gpay">
                  <div className="cpay-logo gpay-text">G Pay</div>
                  <div className="cpay-num">9442887267</div>
                </div>
                <div className="confirm-pay-card phonepe">
                  <div className="cpay-logo phonepe-text">PhonePe</div>
                  <div className="cpay-num">9442887267</div>
                </div>
              </div>
              <p className="confirm-pay-note">💡 Cash also accepted at the shop</p>
            </div>

            {/* Navigation */}
            <div className="confirm-nav-btns">
              <Link to="/dashboard" className="btn-primary">📋 My Bookings</Link>
              <Link to="/services" className="btn-outline">+ Book More</Link>
              <Link to="/" className="btn-outline">← Home</Link>
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
          <p style={{color:"rgba(245,240,232,0.55)",marginTop:"10px"}}>
            Premium grooming — booked in minutes
          </p>
        </div>
      </div>

      <div className="cart-layout container">

        {/* LEFT */}
        <div className="cart-left">
          <h2 className="cart-section-title">🛒 Selected Services</h2>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">✂️</div>
              <h3>Your cart is empty</h3>
              <p>Add services to get started</p>
              <Link to="/services" className="btn-primary" style={{marginTop:"16px"}}>Browse Services</Link>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <span className="cart-item-icon">{item.icon}</span>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-desc">{item.description}</div>
                  </div>
                  <div className="cart-item-price">₹{item.price}</div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)} title="Remove">✕</button>
                </div>
              ))}
              <div className="cart-total">
                <span>Total Amount</span>
                <span className="total-amount">₹{total}</span>
              </div>
              <div className="est-time">
                <span>⏱️</span>
                <span>Estimated duration: <strong>~{estimatedMins} mins</strong></span>
              </div>
            </div>
          )}

          {/* Availability */}
          {branch && date && (
            <div className="availability-card">
              <div className="avail-header">
                📅 {slotLimit === 1 ? "AC Branch — 1 booking per slot" : "Non-AC Branch — 2 bookings per slot"}
              </div>
              {loadingSlots ? (
                <div className="avail-loading">⏳ Checking availability...</div>
              ) : (
                <>
                  <div className="avail-stats">
                    <div className="avail-stat free"><div className="avail-num">{freeCount}</div><div className="avail-label">Available</div></div>
                    <div className="avail-stat taken"><div className="avail-num">{bookedSlots.length}</div><div className="avail-label">Booked</div></div>
                    <div className="avail-stat total-slots"><div className="avail-num">{ALL_SLOTS.length}</div><div className="avail-label">Total</div></div>
                  </div>
                  {freeCount > 0 && freeCount <= 3 && <div className="avail-warning">⚡ Only {freeCount} slots left — book fast!</div>}
                  {freeCount === 0 && <div className="avail-full">😔 Fully booked on this date. Try another date.</div>}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="cart-right">
          <h2 className="cart-section-title">📅 Appointment Details</h2>
          {error && <div className="form-error">⚠️ {error}</div>}

          <div className="booking-form">
            <div className="form-group">
              <label>Select Branch *</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">— Choose a Branch —</option>
                <option value="AC Branch — 92/242, Mudalur Road, Sathankulam">❄️ AC Branch — 92/242, Mudalur Road (1/slot)</option>
                <option value="Non-AC Branch — 92/241, Mudalur Road, Sathankulam">💪 Non-AC Branch — 92/241, Mudalur Road (2/slot)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Appointment Date *</label>
              <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label>
                Time Slot *
                {loadingSlots && <span className="slot-checking"> ⏳ checking...</span>}
              </label>
              {!branch || !date ? (
                <div className="slot-hint">👆 Select branch and date first to see available slots</div>
              ) : (
                <>
                  <div className="time-slots">
                    {ALL_SLOTS.map((slot) => {
                      const isBooked   = bookedSlots.includes(slot);
                      const isSelected = time === slot;
                      return (
                        <button key={slot} type="button"
                          className={`time-slot ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                          onClick={() => !isBooked && setTime(slot)}
                          disabled={isBooked}
                        >
                          {slot}
                          {isBooked && <span className="booked-label">Full</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="slot-legend">
                    <span className="legend-item"><span className="legend-dot free-dot"></span>Available</span>
                    <span className="legend-item"><span className="legend-dot sel-dot"></span>Selected</span>
                    <span className="legend-item"><span className="legend-dot booked-dot-legend"></span>Fully Booked</span>
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label>Your Name *</label>
              <input type="text" placeholder="Enter your full name" value={customerName}
                onChange={(e) => setCustomerName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input type="tel" placeholder="10-digit mobile number" value={customerPhone}
                maxLength={10} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/,"").slice(0,10))} />
            </div>

            {cart.length > 0 && (
              <div className="booking-summary">
                <div className="summary-row"><span>Services Selected</span><span>{cart.length}</span></div>
                <div className="summary-row"><span>Est. Duration</span><span>~{estimatedMins} mins</span></div>
                <div className="summary-row total-row"><span>Total Amount</span><span>₹{total}</span></div>
              </div>
            )}

            <button className="btn-primary confirm-btn" onClick={handleBooking}
              disabled={loading || cart.length === 0}>
              {loading ? (
                <span style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <span style={{width:"18px",height:"18px",border:"2px solid rgba(0,0,0,0.3)",borderTopColor:"#000",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}></span>
                  Booking...
                </span>
              ) : "✅ Confirm Booking"}
            </button>

            <div className="booking-info-note">
              <span>📱</span>
              <span>SMS sent to owner automatically. WhatsApp option shown after confirmation.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CartPage;
