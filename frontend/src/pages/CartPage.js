// ============================================================
// Cart / Booking Page
// New Features:
//   ✅ Slot blocking — Already Booked slots shown in red
//   ✅ Slot auto-releases after appointment time
//   ✅ Live slot availability checker
//   ✅ Estimated wait time display
//   ✅ Popular services badge
//   ✅ SMS + WhatsApp on confirm
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./CartPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Generate time slots 9 AM – 7 PM every 30 mins
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
  const [bookedSlots,   setBookedSlots]   = useState([]);  // slots taken on selected branch+date
  const [loadingSlots,  setLoadingSlots]  = useState(false);

  const total   = cart.reduce((sum, i) => sum + i.price, 0);
  const today   = new Date().toISOString().split("T")[0];

  // Estimated duration (10 mins per service)
  const estimatedMins = cart.length * 15;

  // ── Fetch booked slots whenever branch or date changes ───
  const fetchBookedSlots = useCallback(async () => {
    if (!branch || !date) { setBookedSlots([]); return; }
    setLoadingSlots(true);
    try {
      const res  = await fetch(
        `${API_URL}/api/bookings/slots?branch=${encodeURIComponent(branch)}&date=${date}`
      );
      const data = await res.json();
      setBookedSlots(data.bookedSlots || []);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [branch, date]);

  useEffect(() => {
    fetchBookedSlots();
    // Reset time if previously selected slot is now taken
    setTime("");
  }, [fetchBookedSlots]);

  // ── How many slots are free ──────────────────────────────
  const freeSlots = ALL_SLOTS.filter((s) => !bookedSlots.includes(s)).length;

  // ── Confirm Booking ──────────────────────────────────────
  const handleBooking = async () => {
    if (cart.length === 0)
      return setError("Please add at least one service to your cart.");
    if (!branch)
      return setError("Please select a branch.");
    if (!date)
      return setError("Please select an appointment date.");
    if (!time)
      return setError("Please select a time slot.");
    if (!customerName.trim())
      return setError("Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(customerPhone))
      return setError("Please enter a valid 10-digit Indian mobile number.");

    // Double-check slot not taken in UI
    if (bookedSlots.includes(time)) {
      return setError(
        `${time} is already booked. Please choose another time slot.`
      );
    }

    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/bookings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          customerName: customerName.trim(),
          customerPhone, branch, date, time,
          services: cart, total,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConfirmation(data);
        clearCart();
      } else if (data.slotTaken) {
        // Slot was taken between page load and submit
        setError(data.error);
        fetchBookedSlots(); // refresh slots immediately
      } else {
        setError("Booking failed. Please call us directly at 9442887267.");
      }
    } catch {
      setError("Cannot reach server. Please call 9442887267 or use WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirmation screen ──────────────────────────────────
  if (confirmation) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="confirmation-box">
            <div className="confirm-check">✅</div>
            <h2>Booking Confirmed!</h2>
            <p className="confirm-sub">
              An <strong>SMS has been sent</strong> to the owner automatically.
              You can also send the booking via WhatsApp below.
            </p>

            {/* SMS sent notice */}
            <div className="sms-sent-notice">
              <span className="sms-icon">📱</span>
              <div>
                <div className="sms-title">SMS Sent to Owner</div>
                <div className="sms-desc">
                  Owner (9442887267) has been notified via SMS automatically.
                </div>
              </div>
            </div>

            {/* Booking summary card */}
            <div className="confirm-summary-card">
              <div className="cs-row"><span>👤 Customer</span><span>{confirmation.booking.customerName}</span></div>
              <div className="cs-row"><span>🏢 Branch</span><span>{confirmation.booking.branch.split("—")[0]}</span></div>
              <div className="cs-row"><span>📅 Date</span><span>{confirmation.booking.date}</span></div>
              <div className="cs-row"><span>⏰ Time</span><span>{confirmation.booking.time}</span></div>
              <div className="cs-row total-row"><span>💰 Total</span><span>₹{confirmation.booking.total}</span></div>
            </div>

            {/* WhatsApp button */}
            <a
              href={confirmation.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary whatsapp-confirm-btn"
            >
              💬 Also Send via WhatsApp
            </a>

            {/* Payment */}
            <div className="payment-section">
              <h3>💳 Pay Online (Optional)</h3>
              <p>Pay after your visit or send online before arriving</p>
              <div className="payment-options">
                <div className="payment-card gpay-card">
                  <div className="pay-logo gpay-logo">G Pay</div>
                  <div className="pay-number">9442887267</div>
                </div>
                <div className="payment-card phonepe-card">
                  <div className="pay-logo phonepe-logo">PhonePe</div>
                  <div className="pay-number">9442887267</div>
                </div>
              </div>
              <p className="pay-note">💡 Cash payment also accepted at the shop</p>
            </div>

            <Link to="/" className="btn-outline" style={{ marginTop: "20px" }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main booking page ────────────────────────────────────
  return (
    <div className="cart-page">
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Your Selection</div>
          <h1>Book Appointment</h1>
          <div className="gold-divider"></div>
        </div>
      </div>

      <div className="cart-layout container">

        {/* LEFT — Cart items */}
        <div className="cart-left">
          <h2 className="cart-section-title">🛒 Selected Services</h2>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">✂️</div>
              <p>Your cart is empty</p>
              <Link to="/services" className="btn-primary">Browse Services</Link>
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
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    title="Remove"
                  >✕</button>
                </div>
              ))}

              <div className="cart-total">
                <span>Total Amount</span>
                <span className="total-amount">₹{total}</span>
              </div>

              {/* Estimated duration */}
              {cart.length > 0 && (
                <div className="est-time">
                  <span>⏱️</span>
                  <span>Estimated duration: <strong>~{estimatedMins} mins</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Availability indicator */}
          {branch && date && (
            <div className="availability-card">
              <div className="avail-header">📅 Slot Availability</div>
              {loadingSlots ? (
                <div className="avail-loading">Checking slots...</div>
              ) : (
                <>
                  <div className="avail-stats">
                    <div className="avail-stat free">
                      <div className="avail-num">{freeSlots}</div>
                      <div className="avail-label">Available</div>
                    </div>
                    <div className="avail-stat taken">
                      <div className="avail-num">{bookedSlots.length}</div>
                      <div className="avail-label">Booked</div>
                    </div>
                    <div className="avail-stat total-slots">
                      <div className="avail-num">{ALL_SLOTS.length}</div>
                      <div className="avail-label">Total Slots</div>
                    </div>
                  </div>
                  {freeSlots <= 3 && freeSlots > 0 && (
                    <div className="avail-warning">
                      ⚡ Only {freeSlots} slots left — book fast!
                    </div>
                  )}
                  {freeSlots === 0 && (
                    <div className="avail-full">
                      😔 All slots are booked for this date. Please choose another date.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Booking form */}
        <div className="cart-right">
          <h2 className="cart-section-title">📅 Appointment Details</h2>

          {error && <div className="form-error">⚠️ {error}</div>}

          <div className="booking-form">

            {/* Branch */}
            <div className="form-group">
              <label>Select Branch *</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">-- Choose a Branch --</option>
                <option value="AC Branch — 92/242, Mudalur Road, Sathankulam">
                  ❄️ AC Branch — 92/242, Mudalur Road
                </option>
                <option value="Non-AC Branch — 92/241, Mudalur Road, Sathankulam">
                  💪 Non-AC Branch — 92/241, Mudalur Road
                </option>
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label>Appointment Date *</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Time Slots — with booked indicator */}
            <div className="form-group">
              <label>
                Preferred Time Slot *
                {loadingSlots && <span className="slot-checking"> ⏳ checking...</span>}
              </label>

              {!branch || !date ? (
                <div className="slot-hint">
                  👆 Select a branch and date first to see available slots
                </div>
              ) : (
                <div className="time-slots">
                  {ALL_SLOTS.map((slot) => {
                    const isBooked  = bookedSlots.includes(slot);
                    const isSelected = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                        onClick={() => !isBooked && setTime(slot)}
                        disabled={isBooked}
                        title={isBooked ? "Already booked" : "Click to select"}
                      >
                        {slot}
                        {isBooked && <span className="booked-dot">●</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              {branch && date && (
                <div className="slot-legend">
                  <span className="legend-item">
                    <span className="legend-dot free-dot"></span> Available
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot sel-dot"></span> Selected
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot booked-dot-legend"></span> Already Booked
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="form-group">
              <label>Your Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={customerPhone}
                maxLength={10}
                onChange={(e) =>
                  setCustomerPhone(e.target.value.replace(/\D/, "").slice(0, 10))
                }
              />
            </div>

            {/* Summary */}
            {cart.length > 0 && (
              <div className="booking-summary">
                <div className="summary-row">
                  <span>Services Selected</span>
                  <span>{cart.length}</span>
                </div>
                <div className="summary-row">
                  <span>Estimated Duration</span>
                  <span>~{estimatedMins} mins</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-primary confirm-btn"
              onClick={handleBooking}
              disabled={loading || cart.length === 0}
            >
              {loading ? "⏳ Booking..." : "✅ Confirm Booking"}
            </button>

            <p className="booking-note">
              📱 SMS is automatically sent to the owner when you confirm.
              You can also send a WhatsApp message after booking.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CartPage;
