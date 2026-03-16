// ============================================================
// User Dashboard
// Features:
//  - Shows all upcoming bookings for logged-in customer
//  - Each booking has: full details + WhatsApp button
//  - Cancel booking → shows WhatsApp cancel notification
//  - Bookings grouped by Today / Upcoming
//  - Auto-refreshes every 60 seconds
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function to24(t) {
  if (!t) return "00:00";
  const [time, p] = t.split(" ");
  let [h,m] = time.split(":").map(Number);
  if (p==="PM"&&h!==12) h+=12;
  if (p==="AM"&&h===12) h=0;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function buildBookingWA(b) {
  const svcs = (b.services||[]).map(s=>`${s.name} (Rs.${s.price})`).join(", ");
  return `New Booking - Lovely Mens Beauty Parlour\n\n`+
    `Customer: ${b.customerName}\n`+
    `Phone: ${b.customerPhone}\n`+
    `Branch: ${b.branch}\n`+
    `Services: ${svcs}\n`+
    `Total: Rs.${b.total}\n`+
    `Date: ${b.date}\n`+
    `Time: ${b.time}\n\n`+
    `Sent via Lovely Mens Beauty Parlour Website`;
}

function buildCancelWA(b) {
  const svcs = (b.services||[]).map(s=>s.name).join(", ");
  return `Booking Cancelled - Lovely Mens Beauty Parlour\n\n`+
    `Customer: ${b.customerName}\n`+
    `Phone: ${b.customerPhone}\n`+
    `Branch: ${(b.branch||"").split("—")[0].trim()}\n`+
    `Services: ${svcs}\n`+
    `Date: ${b.date}\n`+
    `Time: ${b.time}\n\n`+
    `This booking has been cancelled by the customer.`;
}

export default function UserDashboard({ userPhone, onLogout }) {
  const [bookings,       setBookings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [deleting,       setDeleting]       = useState(null);
  const [cancelledBook,  setCancelledBook]  = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const navigate = useNavigate();

  const fetchBookings = useCallback(async (silent = false) => {
    if (!userPhone) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res  = await fetch(`${API_URL}/api/bookings/user/${userPhone}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      // Sort by date+time
      list.sort((a,b) => {
        const da = new Date(`${a.date} ${to24(a.time)}`);
        const db = new Date(`${b.date} ${to24(b.time)}`);
        return da - db;
      });
      setBookings(list);
    } catch { setBookings([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [userPhone]);

  useEffect(() => {
    if (!userPhone) { navigate("/login"); return; }
    fetchBookings();
    // Auto-refresh every 60s
    const iv = setInterval(() => fetchBookings(true), 60000);
    return () => clearInterval(iv);
  }, [userPhone, fetchBookings, navigate]);

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel booking on ${booking.date} at ${booking.time}?`)) return;
    setDeleting(booking.id || booking._id);
    try {
      const id  = booking.id || booking._id;
      const res = await fetch(`${API_URL}/api/bookings/${id}`, { method: "DELETE" });
      const d   = await res.json();
      if (d.success !== false) {
        setBookings(prev => prev.filter(b => (b.id||b._id) !== id));
        setCancelledBook(booking); // show WhatsApp cancel screen
      } else {
        alert("Failed to cancel. Please try again.");
      }
    } catch { alert("Failed to cancel. Please try again."); }
    finally { setDeleting(null); }
  };

  const handleLogout = () => { onLogout(); navigate("/login"); };

  const today   = new Date().toISOString().split("T")[0];
  const todayBk = bookings.filter(b => b.date === today);
  const futureBk= bookings.filter(b => b.date >  today);
  const totalAmt= bookings.reduce((s,b)=>s+(b.total||0), 0);

  /* ── CANCELLED SCREEN ─────────────────────────────────── */
  if (cancelledBook) {
    const msg    = buildCancelWA(cancelledBook);
    const waLink = `https://wa.me/919442887267?text=${encodeURIComponent(msg)}`;
    return (
      <div className="ud-page">
        <div className="container">
          <div className="ud-cancel-screen">
            <div className="ucs-icon">🗑️</div>
            <h2>Booking Cancelled</h2>
            <p className="ucs-sub">Your booking has been successfully cancelled.</p>

            <div className="ucs-details">
              <div className="ucs-row"><span>📅 Date</span><span>{cancelledBook.date}</span></div>
              <div className="ucs-row"><span>⏰ Time</span><span>{cancelledBook.time}</span></div>
              <div className="ucs-row"><span>🏢 Branch</span><span>{(cancelledBook.branch||"").split("—")[0].trim()}</span></div>
              <div className="ucs-row"><span>✂️ Services</span><span>{(cancelledBook.services||[]).map(s=>s.name).join(", ")}</span></div>
            </div>

            <div className="ucs-wa-box">
              <div className="ucs-wa-title">
                <span className="ucs-wa-dot"></span>
                Notify Owner via WhatsApp
              </div>
              <p className="ucs-wa-desc">
                Let the owner know you've cancelled so they can free the slot for others.
              </p>
              <a href={waLink} target="_blank" rel="noreferrer" className="ucs-wa-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/></svg>
                Send Cancellation via WhatsApp
              </a>
            </div>

            <button className="ucs-done-btn" onClick={() => { setCancelledBook(null); fetchBookings(); }}>
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN DASHBOARD ───────────────────────────────────── */
  return (
    <div className="ud-page">

      {/* Header */}
      <div className="ud-header">
        <div className="ud-hdr-inner container">
          <div className="ud-hdr-left">
            <div className="ud-avatar">{userPhone.slice(-2)}</div>
            <div>
              <div className="gold-badge" style={{marginBottom:"4px"}}>My Account</div>
              <h1 className="ud-h1">My Bookings</h1>
              <div className="ud-sub-phone">📱 +91 {userPhone}</div>
            </div>
          </div>
          <div className="ud-hdr-btns">
            <Link to="/services" className="btn-primary ud-new-btn">+ New Booking</Link>
            <button className="ud-logout" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>
      </div>

      <div className="container ud-body">

        {/* Stats */}
        <div className="ud-stats">
          {[
            { num: bookings.length, lbl: "Upcoming" },
            { num: todayBk.length,  lbl: "Today"    },
            { num: `₹${totalAmt}`,  lbl: "Total Value" },
          ].map((s,i) => (
            <div key={i} className="ud-stat-item">
              <div className="usi-num">{s.num}</div>
              <div className="usi-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Auto-note */}
        <div className="ud-auto-note">
          ℹ️ Only your <strong>upcoming</strong> bookings are shown. Past bookings are automatically removed.
          {refreshing && <span className="ud-refreshing"> ⏳ refreshing...</span>}
        </div>

        {loading ? (
          <div className="ud-loading">
            <div className="ud-spin"></div>
            <p>Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="ud-empty">
            <div style={{fontSize:"3.5rem",marginBottom:"16px"}}>📅</div>
            <h3>No upcoming bookings</h3>
            <p>You don't have any upcoming appointments.</p>
            <Link to="/services" className="btn-primary ud-book-more">Browse Services & Book</Link>
          </div>
        ) : (
          <div className="ud-groups">

            {/* Today */}
            {todayBk.length > 0 && (
              <div className="ud-date-grp">
                <div className="ud-date-hdr">
                  <span className="ud-today-dot"></span>
                  <span className="ud-today-lbl">Today's Appointments</span>
                  <span className="ud-date-cnt">{todayBk.length}</span>
                </div>
                {todayBk.map(b => (
                  <BookingCard
                    key={b.id||b._id}
                    booking={b}
                    onCancel={handleCancel}
                    deleting={deleting}
                    isToday={true}
                  />
                ))}
              </div>
            )}

            {/* Future */}
            {futureBk.length > 0 && (
              <div className="ud-date-grp">
                <div className="ud-date-hdr">
                  <span>📅</span>
                  <span>Upcoming Appointments</span>
                  <span className="ud-date-cnt">{futureBk.length}</span>
                </div>
                {futureBk.map(b => (
                  <BookingCard
                    key={b.id||b._id}
                    booking={b}
                    onCancel={handleCancel}
                    deleting={deleting}
                    isToday={false}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

/* ── Booking Card Component ─────────────────────────────── */
function BookingCard({ booking: b, onCancel, deleting, isToday }) {
  const id       = b.id || b._id;
  const isBusy   = deleting === id;
  const services = b.services || [];
  const waMsg    = buildBookingWA(b);
  const waLink   = `https://wa.me/919442887267?text=${encodeURIComponent(waMsg)}`;
  const [waClicked, setWaClicked] = useState(false);

  const handleWA = () => {
    setWaClicked(true);
    window.open(waLink, "_blank");
    setTimeout(() => setWaClicked(false), 3000);
  };

  return (
    <div className={`ubc-card ${isToday ? "ubc-today" : ""}`}>
      {isToday && <div className="ubc-today-strip">📍 Today</div>}

      {/* Top: date + time + amount */}
      <div className="ubc-main">
        <div className="ubc-time-badge">
          <div className="ubc-time">{b.time}</div>
          <div className="ubc-dur">📅 {b.date}</div>
        </div>
        <div className="ubc-branch-name">
          {(b.branch||"").split("—")[0].trim()}
        </div>
        <div className="ubc-total-val">₹{b.total}</div>
      </div>

      {/* Customer row */}
      <div className="ubc-cust-row">
        <span>👤 {b.customerName}</span>
        <span>📞 {b.customerPhone}</span>
      </div>

      {/* Services list — every service on its own row */}
      <div className="ubc-services">
        {services.map((s,i) => (
          <div key={i} className="ubc-svc-row">
            <span className="ubc-svc-icon">{s.icon||"✂️"}</span>
            <span className="ubc-svc-name">{s.name}</span>
            <span className="ubc-svc-price">₹{s.price}</span>
          </div>
        ))}
      </div>

      {/* Total + Actions */}
      <div className="ubc-total-row">
        <div>
          <span className="ubc-total-lbl">Total: </span>
          <strong style={{color:"#c9a84c",fontFamily:"'Playfair Display',serif",fontSize:"1rem"}}>₹{b.total}</strong>
        </div>
        <div className="ubc-actions">
          {/* WhatsApp send button */}
          <button
            className={`ubc-wa-btn ${waClicked?"ubc-wa-sent":""}`}
            onClick={handleWA}
            title="Send booking details to owner via WhatsApp"
          >
            {waClicked ? "✓ Opening..." : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/></svg>
                Send via WhatsApp
              </>
            )}
          </button>

          {/* Cancel button */}
          <button
            className={`ubc-cancel-btn ${isBusy?"ubc-canceling":""}`}
            onClick={() => onCancel(b)}
            disabled={isBusy}
          >
            {isBusy ? "⏳ Canceling..." : "🗑️ Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
