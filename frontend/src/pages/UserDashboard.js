import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function UserDashboard({ userPhone, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userPhone) { navigate("/login"); return; }
    fetchMyBookings();
  }, [userPhone]);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/bookings/user/${userPhone}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await fetch(`${API_URL}/api/bookings/${id}`, { method: "DELETE" });
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert("Failed to cancel. Please try again.");
    }
  };

  const handleLogout = () => { onLogout(); navigate("/login"); };

  const now      = new Date();
  const upcoming = bookings.filter((b) => new Date(`${b.date} ${b.time}`) >= now);
  const past     = bookings.filter((b) => new Date(`${b.date} ${b.time}`) <  now);

  return (
    <div className="user-dash">
      {/* Header */}
      <div className="ud-header">
        <div className="ud-header-inner container">
          <div>
            <div className="gold-badge" style={{ marginBottom: "4px" }}>My Account</div>
            <h1>My Bookings</h1>
            <p className="ud-phone">📞 {userPhone}</p>
          </div>
          <div className="ud-header-actions">
            <Link to="/cart" className="btn-primary ud-book-btn">+ New Booking</Link>
            <button className="btn-outline ud-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="ud-body container">
        {loading ? (
          <div className="ud-loading">Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="ud-empty">
            <div className="ud-empty-icon">✂️</div>
            <h3>No bookings yet</h3>
            <p>Book your first appointment now!</p>
            <Link to="/services" className="btn-primary" style={{ marginTop: "16px" }}>Browse Services</Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="ud-section">
                <h2 className="ud-section-title">
                  📅 Upcoming Appointments
                  <span className="ud-count">{upcoming.length}</span>
                </h2>
                <div className="ud-bookings-grid">
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} canCancel onCancel={handleCancel} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="ud-section" style={{ marginTop: "40px" }}>
                <h2 className="ud-section-title">
                  🕐 Past Appointments
                  <span className="ud-count past-count">{past.length}</span>
                </h2>
                <div className="ud-bookings-grid">
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} canCancel={false} onCancel={handleCancel} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, canCancel, onCancel }) {
  const isPast = new Date(`${booking.date} ${booking.time}`) < new Date();

  return (
    <div className={`ud-booking-card ${isPast ? "past-card" : ""}`}>
      <div className="ubc-header">
        <div className="ubc-branch">{booking.branch?.split("—")[0]}</div>
        <div className={`ubc-status ${isPast ? "status-past" : "status-upcoming"}`}>
          {isPast ? "Completed" : "Upcoming"}
        </div>
      </div>

      <div className="ubc-datetime">
        <span>📅 {booking.date}</span>
        <span>⏰ {booking.time}</span>
      </div>

      <div className="ubc-services">
        {(booking.services || []).map((s, i) => (
          <span key={i} className="ubc-service-tag">{s.icon} {s.name}</span>
        ))}
      </div>

      <div className="ubc-footer">
        <div className="ubc-total">₹{booking.total}</div>
        {canCancel && (
          <button className="ubc-cancel-btn" onClick={() => onCancel(booking.id)}>
            ✕ Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
