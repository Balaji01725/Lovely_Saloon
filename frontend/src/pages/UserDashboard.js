import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function convertTo24(t) {
  if (!t) return "00:00";
  const [time, pd] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (pd === "PM" && h !== 12) h += 12;
  if (pd === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

export default function UserDashboard({ userPhone, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userPhone) { navigate("/login"); return; }
    fetchAndClean();
  }, [userPhone]);

  const fetchAndClean = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/user/${userPhone}`);
      const all = Array.isArray(await res.json()) ? await res.json() : [];
      const now = new Date();

      // Auto-delete expired bookings silently
      const expired = all.filter(b => new Date(`${b.date} ${convertTo24(b.time)}`) < now);
      for (const b of expired) {
        fetch(`${API_URL}/api/bookings/${b.id}`, { method:"DELETE" }).catch(()=>{});
      }

      // Show only upcoming
      setBookings(all.filter(b => new Date(`${b.date} ${convertTo24(b.time)}`) >= now)
        .sort((a,b) => new Date(`${a.date} ${convertTo24(a.time)}`) - new Date(`${b.date} ${convertTo24(b.time)}`)));
    } catch { setBookings([]); }
    finally { setLoading(false); }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/api/bookings/${id}`, { method:"DELETE" });
      setBookings(p => p.filter(b => b.id !== id));
    } catch { alert("Failed to cancel. Please try again."); }
    finally { setDeleting(null); }
  };

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0];
  const fmtDate  = d => {
    if (d===today)    return "📅 Today";
    if (d===tomorrow) return "📅 Tomorrow";
    return new Date(d).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  };

  // Group by date
  const grouped = bookings.reduce((acc,b)=>{ if(!acc[b.date]) acc[b.date]=[]; acc[b.date].push(b); return acc; },{});

  return (
    <div className="ud-page">
      <div className="ud-header">
        <div className="container ud-hdr-inner">
          <div>
            <div className="gold-badge" style={{marginBottom:"4px"}}>My Account</div>
            <h1 className="ud-h1">My Bookings</h1>
            <div className="ud-sub-phone">📱 +91 {userPhone}</div>
          </div>
          <div className="ud-hdr-btns">
            <Link to="/services" className="btn-primary ud-new-btn">✂️ New Booking</Link>
            <button className="ud-logout" onClick={()=>{onLogout();navigate("/login");}}>🚪 Logout</button>
          </div>
        </div>
      </div>

      <div className="container ud-body">
        <div className="ud-stats">
          <div className="ud-stat-item"><div className="usi-num">{bookings.length}</div><div className="usi-lbl">Upcoming</div></div>
          <div className="ud-stat-item"><div className="usi-num">₹{bookings.reduce((s,b)=>s+(b.total||0),0)}</div><div className="usi-lbl">Total Booked</div></div>
          <div className="ud-stat-item"><div className="usi-num">{new Set(bookings.map(b=>b.branch?.split("—")[0]?.trim())).size||0}</div><div className="usi-lbl">Branches</div></div>
        </div>

        <div className="ud-auto-note">
          ℹ️ Past bookings are <strong>automatically removed</strong> after your appointment time. Only your upcoming bookings are shown here.
        </div>

        {loading ? (
          <div className="ud-loading"><div className="ud-spin"></div><p>Loading your bookings...</p></div>
        ) : bookings.length === 0 ? (
          <div className="ud-empty">
            <div style={{fontSize:"3.2rem",marginBottom:"14px"}}>✂️</div>
            <h3>No Upcoming Bookings</h3>
            <p>Book your next appointment at Lovely Mens Beauty Parlour</p>
            <Link to="/services" className="btn-primary" style={{marginTop:"20px"}}>Browse Services & Book</Link>
          </div>
        ) : (
          <div className="ud-groups">
            {Object.entries(grouped).map(([date, dayBkgs]) => (
              <div key={date} className="ud-date-grp">
                <div className="ud-date-hdr">
                  <span className="ud-date-txt">{fmtDate(date)}</span>
                  <span className="ud-date-cnt">{dayBkgs.length} appointment{dayBkgs.length>1?"s":""}</span>
                </div>
                {dayBkgs.map(b => (
                  <div key={b.id} className="ubc">
                    <div className="ubc-time-box">
                      <div className="ubc-t">{b.time}</div>
                      <div className="ubc-d">{b.date}</div>
                    </div>
                    <div className="ubc-content">
                      <div className="ubc-branch">{(b.branch||"").split("—")[0].trim()}</div>
                      <div className="ubc-svc-row">
                        {(b.services||[]).map((s,i)=>(
                          <span key={i} className="ubc-svc">{s.icon||"✂️"} {s.name}</span>
                        ))}
                      </div>
                      <div className="ubc-bottom">
                        <span className="ubc-total">₹{b.total}</span>
                        <span className="ubc-dot">·</span>
                        <span className="ubc-dur">~{(b.services||[]).length*15} mins</span>
                      </div>
                    </div>
                    <div className="ubc-btns">
                      <a href={`https://wa.me/919442887267?text=${encodeURIComponent(`Hi, I have a booking on ${b.date} at ${b.time}. Please confirm. — ${b.customerName}`)}`}
                        target="_blank" rel="noreferrer" className="ubc-wa" title="WhatsApp owner">💬</a>
                      <button className={`ubc-cancel ${deleting===b.id?"ubc-deleting":""}`}
                        onClick={()=>cancelBooking(b.id)} disabled={deleting===b.id}>
                        {deleting===b.id?"...":"✕ Cancel"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="ud-book-more">
            <p>Want to add another appointment?</p>
            <Link to="/services" className="btn-outline">✂️ Book More Services</Link>
          </div>
        )}
      </div>
    </div>
  );
}
