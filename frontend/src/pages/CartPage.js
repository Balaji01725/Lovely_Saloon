import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h < 19; h++) {
    ["00", "30"].forEach((m) => {
      if (h === 18 && m === "30") return;
      const hr = h > 12 ? h - 12 : h;
      const pd = h >= 12 ? "PM" : "AM";
      slots.push(`${String(hr).padStart(2,"0")}:${m} ${pd}`);
    });
  }
  return slots;
}
const ALL_SLOTS = generateTimeSlots();

export default function CartPage({ cart, removeFromCart, clearCart }) {
  const navigate = useNavigate();
  const [branch,        setBranch]       = useState("");
  const [date,          setDate]         = useState("");
  const [time,          setTime]         = useState("");
  const [name,          setName]         = useState("");
  const [phone,         setPhone]        = useState("");
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState("");
  const [confirmation,  setConfirmation] = useState(null);
  const [bookedSlots,   setBookedSlots]  = useState([]);
  const [slotLimit,     setSlotLimit]    = useState(1);
  const [loadingSlots,  setLoadingSlots] = useState(false);
  const [waClicked,     setWaClicked]    = useState(false);
  const [confetti,      setConfetti]     = useState(false);

  const total = cart.reduce((s, i) => s + i.price, 0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const p = localStorage.getItem("lmbp_phone") || "";
    if (p) setPhone(p);
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!branch || !date) { setBookedSlots([]); return; }
    setLoadingSlots(true);
    try {
      const r = await fetch(`${API_URL}/api/bookings/slots?branch=${encodeURIComponent(branch)}&date=${date}`);
      const d = await r.json();
      setBookedSlots(d.bookedSlots || []);
      setSlotLimit(d.slotLimit || 1);
    } catch { setBookedSlots([]); }
    finally { setLoadingSlots(false); }
  }, [branch, date]);

  useEffect(() => { fetchSlots(); setTime(""); }, [fetchSlots]);

  const freeCount = ALL_SLOTS.filter(s => !bookedSlots.includes(s)).length;

  /* ── Submit ── */
  const handleBook = async () => {
    if (!cart.length)           return setError("Add at least one service.");
    if (!branch)                return setError("Select a branch.");
    if (!date)                  return setError("Select an appointment date.");
    if (!time)                  return setError("Select a time slot.");
    if (!name.trim())           return setError("Enter your full name.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit mobile number.");
    if (bookedSlots.includes(time)) return setError(`${time} is fully booked. Choose another slot.`);

    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName:name.trim(), customerPhone:phone, branch, date, time, services:cart, total }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmation(data);
        clearCart();
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3500);
      } else if (data.slotTaken) {
        setError(data.error); fetchSlots();
      } else {
        setError("Booking failed. Please call 9442887267.");
      }
    } catch { setError("Cannot connect. Please call 9442887267."); }
    finally   { setLoading(false); }
  };

  /* ── WhatsApp ── */
  const sendWhatsApp = () => {
    setWaClicked(true);
    window.open(confirmation.whatsappLink, "_blank");
    setTimeout(() => setWaClicked(false), 3000);
  };

  /* ── Book Another ── reset form, keep name+phone ── */
  const bookAnother = () => {
    setConfirmation(null);
    setWaClicked(false);
    setConfetti(false);
    setBranch("");
    setDate("");
    setTime("");
    setError("");
    setBookedSlots([]);
    navigate("/services");
  };

  /* ════════════════════════════════════════
     CONFIRMATION SCREEN
  ════════════════════════════════════════ */
  if (confirmation) {
    const b    = confirmation.booking;
    const svcs = b.services || [];
    return (
      <div className="cp-page confirm-bg">
        {/* Confetti */}
        {confetti && (
          <div className="confetti-container">
            {Array.from({length:28}).map((_,i) => (
              <span key={i} className="cp-dot" style={{
                left:`${Math.random()*100}%`,
                width:`${7+Math.random()*9}px`,
                height:`${7+Math.random()*9}px`,
                animationDelay:`${Math.random()*2}s`,
                animationDuration:`${2.2+Math.random()*1.8}s`,
                background:["#c9a84c","#25d366","#fff","#f59e0b","#60a5fa","#f472b6"][i%6],
                borderRadius: i%3===0?"50%":"3px",
              }}/>
            ))}
          </div>
        )}

        <div className="container">
          <div className="confirm-page-inner">

            {/* ── Success Header ── */}
            <div className="success-header">
              <div className="success-rings">
                <div className="sr sr1"></div>
                <div className="sr sr2"></div>
                <div className="success-circle">
                  <span className="success-emoji">✅</span>
                </div>
              </div>
              <h1 className="success-title">Booking Confirmed!</h1>
              <p className="success-sub">Your appointment is all set. See you soon! 💈</p>

              {/* SMS sent indicator */}
              <div className="sms-sent-pill">
                <span className="sms-pulse"></span>
                SMS sent to owner <strong>9442887267</strong> automatically
              </div>
            </div>

            {/* ── Full Booking Details ── */}
            <div className="booking-details-card">
              {/* Card header */}
              <div className="bdc-header">
                <div className="bdc-logo-wrap">
                  <img src="/logo.png" alt="Logo" className="bdc-logo" />
                </div>
                <div className="bdc-title">
                  <div className="bdc-salon">Lovely Mens Beauty Parlour</div>
                  <div className="bdc-location">📍 Sathankulam, Tamil Nadu</div>
                </div>
                <div className="bdc-status-badge">✓ CONFIRMED</div>
              </div>

              {/* Tear line */}
              <div className="bdc-tear">
                <div className="bdc-hole bdc-hole-l"></div>
                <div className="bdc-dashed"></div>
                <div className="bdc-hole bdc-hole-r"></div>
              </div>

              {/* Details */}
              <div className="bdc-body">
                {/* Row 1: Name + Phone */}
                <div className="bdc-row">
                  <div className="bdc-field">
                    <div className="bdc-lbl">👤 Customer Name</div>
                    <div className="bdc-val">{b.customerName}</div>
                  </div>
                  <div className="bdc-field">
                    <div className="bdc-lbl">📞 Mobile Number</div>
                    <div className="bdc-val">{b.customerPhone}</div>
                  </div>
                </div>
                {/* Row 2: Date + Time */}
                <div className="bdc-row">
                  <div className="bdc-field">
                    <div className="bdc-lbl">📅 Appointment Date</div>
                    <div className="bdc-val bdc-gold bdc-big">{b.date}</div>
                  </div>
                  <div className="bdc-field">
                    <div className="bdc-lbl">⏰ Appointment Time</div>
                    <div className="bdc-val bdc-gold bdc-big">{b.time}</div>
                  </div>
                </div>
                {/* Branch */}
                <div className="bdc-field bdc-field-full">
                  <div className="bdc-lbl">🏢 Branch</div>
                  <div className="bdc-val">{(b.branch||"").split("—")[0].trim()}</div>
                </div>

                {/* Services list */}
                <div className="bdc-services-block">
                  <div className="bdc-services-title">✂️ Services Booked</div>
                  <div className="bdc-services-list">
                    {svcs.map((s,i) => (
                      <div key={i} className="bdc-svc-item">
                        <span className="bdc-svc-icon">{s.icon || "✂️"}</span>
                        <span className="bdc-svc-name">{s.name}</span>
                        <span className="bdc-svc-amt">₹{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total footer */}
              <div className="bdc-footer">
                <div>
                  <div className="bdc-total-lbl">Total Amount</div>
                  <div className="bdc-pay-note">Pay at shop or via GPay/PhonePe: 9442887267</div>
                </div>
                <div className="bdc-total-val">₹{b.total}</div>
              </div>
            </div>

            {/* ── WhatsApp Section ── */}
            <div className="wa-section">
              <div className="wa-section-header">
                <div className="wa-live-dot"></div>
                <span className="wa-section-title">Send Booking to Owner via WhatsApp</span>
              </div>
              <p className="wa-section-desc">
                Tap the button below to send your full booking summary directly to the owner on WhatsApp (9442887267).
              </p>

              {/* Message preview */}
              <div className="wa-preview-card">
                <div className="wa-preview-top">
                  <span className="wa-preview-icon">💬</span>
                  <span className="wa-preview-label">Message Preview</span>
                  <span className="wa-preview-to">To: 9442887267</span>
                </div>
                <div className="wa-preview-bubble">
                  <p className="wa-line"><strong>New Booking — Lovely Mens Beauty Parlour</strong></p>
                  <p className="wa-line">Customer: {b.customerName}</p>
                  <p className="wa-line">Phone: {b.customerPhone}</p>
                  <p className="wa-line">Branch: {(b.branch||"").split("—")[0].trim()}</p>
                  <p className="wa-line">Services: {svcs.map(s=>s.name).join(", ")}</p>
                  <p className="wa-line">Total: ₹{b.total}</p>
                  <p className="wa-line">Date: {b.date} at {b.time}</p>
                  <div className="wa-preview-ticks">✓✓</div>
                </div>
              </div>

              {/* WhatsApp Button */}
              <button className={`wa-big-btn ${waClicked?"wa-sending":""}`} onClick={sendWhatsApp}>
                <span className="wa-big-btn-inner">
                  {waClicked ? (
                    <>
                      <span className="wa-tick-anim">✓</span>
                      <span>Opening WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <svg className="wa-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                      </svg>
                      <span>Send via WhatsApp to Owner</span>
                      <span className="wa-arrow-icon">→</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* ── Payment ── */}
            <div className="confirm-pay-row">
              <div className="cpr-card gpay">
                <div className="cpr-logo" style={{color:"#4285f4"}}>G Pay</div>
                <div className="cpr-num">9442887267</div>
              </div>
              <div className="cpr-card phonepe">
                <div className="cpr-logo" style={{color:"#8b5cf6"}}>PhonePe</div>
                <div className="cpr-num">9442887267</div>
              </div>
              <div className="cpr-note">Cash also accepted at shop</div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="confirm-btn-group">
              {/* PRIMARY: Book Another */}
              <button className="book-again-btn" onClick={bookAnother}>
                ✂️ &nbsp; Book Another Appointment
              </button>
              {/* Secondary */}
              <div className="confirm-sec-row">
                <Link to="/dashboard" className="sec-btn">📋 My Bookings</Link>
                <Link to="/"          className="sec-btn">🏠 Home</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     MAIN CART / BOOKING PAGE
  ════════════════════════════════════════ */
  return (
    <div className="cp-page">
      <div className="page-header">
        <div className="container">
          <div className="gold-badge">Your Selection</div>
          <h1>Book Appointment</h1>
          <div className="gold-divider"></div>
          <p style={{color:"rgba(245,240,232,.5)",marginTop:"10px",fontSize:".88rem"}}>
            Premium grooming — booked in minutes
          </p>
        </div>
      </div>

      <div className="cp-layout container">

        {/* LEFT */}
        <div className="cp-left">
          <h2 className="cp-section-title">🛒 Selected Services</h2>

          {cart.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">✂️</div>
              <h3>Your cart is empty</h3>
              <p>Add services from the services page</p>
              <Link to="/services" className="btn-primary" style={{marginTop:"18px"}}>Browse Services</Link>
            </div>
          ) : (
            <>
              <div className="cp-items">
                {cart.map(item => (
                  <div key={item.id} className="cp-item">
                    <span className="cp-item-icon">{item.icon}</span>
                    <div className="cp-item-info">
                      <div className="cp-item-name">{item.name}</div>
                      <div className="cp-item-desc">{item.description}</div>
                    </div>
                    <div className="cp-item-price">₹{item.price}</div>
                    <button className="cp-item-del" onClick={() => removeFromCart(item.id)}>✕</button>
                  </div>
                ))}
                <div className="cp-total-bar">
                  <div>
                    <div className="cp-total-label">Total Amount</div>
                    <div className="cp-total-sub">{cart.length} service{cart.length>1?"s":""} · ~{cart.length*15} min</div>
                  </div>
                  <div className="cp-total-val">₹{total}</div>
                </div>
              </div>

              {/* Availability */}
              {branch && date && (
                <div className="avail-box">
                  <div className="avail-box-title">
                    📅 {slotLimit===1?"AC Branch — 1 per slot":"Non-AC — 2 per slot"}
                  </div>
                  {loadingSlots ? (
                    <div className="avail-loading">⏳ Checking slots...</div>
                  ) : (
                    <>
                      <div className="avail-nums">
                        <div className="avail-num-item">
                          <div className="avail-n green">{freeCount}</div>
                          <div className="avail-n-lbl">Available</div>
                        </div>
                        <div className="avail-sep"></div>
                        <div className="avail-num-item">
                          <div className="avail-n red">{bookedSlots.length}</div>
                          <div className="avail-n-lbl">Booked</div>
                        </div>
                        <div className="avail-sep"></div>
                        <div className="avail-num-item">
                          <div className="avail-n gold">{ALL_SLOTS.length}</div>
                          <div className="avail-n-lbl">Total</div>
                        </div>
                      </div>
                      {freeCount>0&&freeCount<=3&&<div className="avail-warn">⚡ Only {freeCount} slots left!</div>}
                      {freeCount===0&&<div className="avail-full-msg">😔 Fully booked. Try another date.</div>}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="cp-right">
          <h2 className="cp-section-title">📅 Appointment Details</h2>

          {error && <div className="cp-error"><span>⚠️</span><span>{error}</span></div>}

          <div className="cp-form">
            {/* Branch */}
            <div className="cp-field">
              <label>Select Branch *</label>
              <select value={branch} onChange={e=>setBranch(e.target.value)}>
                <option value="">— Choose Branch —</option>
                <option value="AC Branch — 92/242, Mudalur Road, Sathankulam">❄️ AC Branch — 92/242, Mudalur Road (1/slot)</option>
                <option value="Non-AC Branch — 92/241, Mudalur Road, Sathankulam">💪 Non-AC Branch — 92/241, Mudalur Road (2/slot)</option>
              </select>
            </div>

            {/* Date */}
            <div className="cp-field">
              <label>Appointment Date *</label>
              <input type="date" value={date} min={today} onChange={e=>setDate(e.target.value)} />
            </div>

            {/* Time */}
            <div className="cp-field">
              <label>
                Time Slot *
                {loadingSlots&&<span className="cp-checking"> ⏳ checking...</span>}
              </label>
              {!branch||!date ? (
                <div className="cp-slot-hint">👆 Select branch and date first</div>
              ) : (
                <>
                  <div className="cp-slots">
                    {ALL_SLOTS.map(slot=>{
                      const bkd=bookedSlots.includes(slot), sel=time===slot;
                      return (
                        <button key={slot} type="button"
                          className={`cp-slot ${bkd?"cp-slot-bkd":""} ${sel?"cp-slot-sel":""}`}
                          onClick={()=>!bkd&&setTime(slot)} disabled={bkd}
                        >
                          <span>{slot}</span>
                          {bkd&&<span className="cp-slot-tag">Full</span>}
                          {sel&&<span className="cp-slot-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="cp-legend">
                    <span><span className="cp-leg free"></span>Available</span>
                    <span><span className="cp-leg sel"></span>Selected</span>
                    <span><span className="cp-leg bkd"></span>Fully Booked</span>
                  </div>
                </>
              )}
            </div>

            {/* Name */}
            <div className="cp-field">
              <label>Your Full Name *</label>
              <input type="text" placeholder="Enter your full name" value={name} onChange={e=>setName(e.target.value)} />
            </div>

            {/* Phone */}
            <div className="cp-field">
              <label>Mobile Number *</label>
              <div className="cp-phone-wrap">
                <span className="cp-phone-pre">+91</span>
                <input type="tel" placeholder="10-digit mobile number" value={phone} maxLength={10}
                  onChange={e=>setPhone(e.target.value.replace(/\D/,"").slice(0,10))} />
                {phone.length===10&&<span className="cp-phone-ok">✅</span>}
              </div>
            </div>

            {/* Mini summary */}
            {cart.length>0&&(
              <div className="cp-mini-summary">
                <div className="cms-row"><span>Services</span><span>{cart.length} selected</span></div>
                <div className="cms-row"><span>Est. Duration</span><span>~{cart.length*15} mins</span></div>
                <div className="cms-row cms-total"><span>Total</span><span>₹{total}</span></div>
              </div>
            )}

            {/* Submit */}
            <button className="cp-submit-btn" onClick={handleBook} disabled={loading||!cart.length}>
              {loading?(
                <span style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <span className="cp-spinner"></span>Confirming Booking...
                </span>
              ):"✅ Confirm Booking"}
            </button>

            <div className="cp-form-note">
              📱 SMS auto-sent to owner · WhatsApp option shown after confirmation
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
