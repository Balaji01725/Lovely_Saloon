import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AdminDashboard({ onLogout }) {
  const navigate                          = useNavigate();
  const [bookings,     setBookings]       = useState([]);
  const [services,     setServices]       = useState([]);
  const [activeTab,    setActiveTab]      = useState("bookings");
  const [loading,      setLoading]        = useState(true);
  const [editingSvc,   setEditingSvc]     = useState(null);
  const [searchTerm,   setSearchTerm]     = useState("");
  const [filterBranch, setFilterBranch]  = useState("all");
  const [filterStatus, setFilterStatus]  = useState("all");
  const [selectedDate, setSelectedDate]  = useState("");
  const [expandedId,   setExpandedId]    = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`${API_URL}/api/bookings`),
        fetch(`${API_URL}/api/services`),
      ]);
      setBookings(await bRes.json());
      setServices(await sRes.json());
    } catch { console.error("Load error"); }
    setLoading(false);
  };

  const handleLogout  = () => { onLogout(); navigate("/login"); };
  const handleDelete  = async (id) => {
    if (!window.confirm("Remove this booking?")) return;
    await fetch(`${API_URL}/api/bookings/${id}`, { method: "DELETE" });
    setBookings((p) => p.filter((b) => b.id !== id));
  };
  const handleSaveSvc = async (svc) => {
    await fetch(`${API_URL}/api/services/${svc.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(svc),
    });
    setServices((p) => p.map((s) => s.id === svc.id ? svc : s));
    setEditingSvc(null);
  };

  const now      = new Date();
  const upcoming = bookings.filter((b) => new Date(`${b.date} ${b.time}`) >= now);
  const past     = bookings.filter((b) => new Date(`${b.date} ${b.time}`) <  now);
  const revenue  = bookings.reduce((s, b) => s + (b.total || 0), 0);
  const customers = [...new Map(bookings.map((b) => [b.customerPhone, b])).values()];

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchSearch = !searchTerm ||
      b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone?.includes(searchTerm);
    const matchBranch = filterBranch === "all" ||
      (filterBranch === "ac" && b.branch?.toLowerCase().includes("ac branch")) ||
      (filterBranch === "nonac" && b.branch?.toLowerCase().includes("non-ac"));
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "upcoming" && new Date(`${b.date} ${b.time}`) >= now) ||
      (filterStatus === "past"     && new Date(`${b.date} ${b.time}`) <  now);
    const matchDate   = !selectedDate || b.date === selectedDate;
    return matchSearch && matchBranch && matchStatus && matchDate;
  });

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="admin-dashboard">

      {/* ── Header ── */}
      <div className="admin-hdr">
        <div className="admin-hdr-inner">
          <div className="admin-hdr-left">
            <img src="/logo.png" alt="Logo" className="admin-logo" />
            <div>
              <div className="gold-badge" style={{ marginBottom: "4px" }}>Owner Panel</div>
              <h1>Admin Dashboard</h1>
              <p className="admin-hdr-sub">Lovely Mens Beauty Parlour — 9442887267</p>
            </div>
          </div>
          <div className="admin-hdr-actions">
            <button className="refresh-btn" onClick={loadData} title="Refresh">🔄</button>
            <button className="btn-outline logout-btn" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="admin-stats container">
        {[
          { icon: "📅", num: bookings.length,               label: "Total Bookings",  color: "#c9a84c" },
          { icon: "🔜", num: upcoming.length,               label: "Upcoming",        color: "#4ade80" },
          { icon: "✅", num: past.length,                   label: "Completed",       color: "#60a5fa" },
          { icon: "👥", num: customers.length,              label: "Customers",       color: "#a78bfa" },
          { icon: "💰", num: `₹${revenue.toLocaleString()}`,label: "Total Revenue",   color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} className="astat" style={{ "--stat-color": s.color }}>
            <div className="astat-icon">{s.icon}</div>
            <div className="astat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="astat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="admin-body container">
        <div className="admin-tabs">
          {[
            { id: "bookings",  label: `📅 All Bookings (${bookings.length})`   },
            { id: "today",     label: `📆 Today (${bookings.filter(b => b.date === new Date().toISOString().split("T")[0]).length})` },
            { id: "customers", label: `👥 Customers (${customers.length})`     },
            { id: "services",  label: "✂️ Services"                             },
          ].map((t) => (
            <button key={t.id} className={`atab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* ── ALL BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div>
            {/* Filters */}
            <div className="booking-filters">
              <input
                className="filter-search"
                placeholder="🔍 Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <input
                className="filter-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                title="Filter by date"
              />
              <select className="filter-select" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                <option value="all">All Branches</option>
                <option value="ac">❄️ AC Branch</option>
                <option value="nonac">💪 Non-AC Branch</option>
              </select>
              <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Completed</option>
              </select>
              {(searchTerm || selectedDate || filterBranch !== "all" || filterStatus !== "all") && (
                <button className="clear-filters" onClick={() => { setSearchTerm(""); setSelectedDate(""); setFilterBranch("all"); setFilterStatus("all"); }}>
                  ✕ Clear
                </button>
              )}
            </div>

            <div className="filter-count">
              Showing <strong>{filteredBookings.length}</strong> of {bookings.length} bookings
            </div>

            {filteredBookings.length === 0 ? (
              <div className="admin-empty">No bookings match your filters.</div>
            ) : (
              <div className="bookings-cards-list">
                {filteredBookings.map((b, i) => {
                  const isPast     = new Date(`${b.date} ${b.time}`) < now;
                  const isExpanded = expandedId === b.id;
                  const svcList    = (b.services || []).map((s) => s.name).join(", ");
                  const waMsg      = `New Booking - Lovely Mens Beauty Parlour\n\nCustomer: ${b.customerName}\nPhone: ${b.customerPhone}\nBranch: ${b.branch}\nServices: ${svcList}\nTotal: Rs.${b.total}\nDate: ${b.date}\nTime: ${b.time}`;

                  return (
                    <div key={b.id} className={`booking-card-admin ${isPast ? "bc-past" : "bc-upcoming"}`}>
                      {/* Card header — always visible */}
                      <div className="bca-header" onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                        <div className="bca-left">
                          <div className="bca-avatar">{b.customerName?.charAt(0)?.toUpperCase()}</div>
                          <div className="bca-main-info">
                            <div className="bca-name">{b.customerName}</div>
                            <div className="bca-phone">📞 {b.customerPhone}</div>
                          </div>
                        </div>
                        <div className="bca-center">
                          <div className="bca-datetime">
                            <span className="bca-date">📅 {b.date}</span>
                            <span className="bca-time">⏰ {b.time}</span>
                          </div>
                          <div className="bca-branch">{b.branch?.split("—")[0]}</div>
                        </div>
                        <div className="bca-right">
                          <div className="bca-amount">₹{b.total}</div>
                          <span className={`bca-status ${isPast ? "st-done" : "st-upcoming"}`}>
                            {isPast ? "✅ Done" : "🔜 Upcoming"}
                          </span>
                          <span className="bca-expand">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="bca-expanded">
                          <div className="bca-detail-grid">
                            <div className="bca-detail-item">
                              <div className="bca-detail-label">Customer Name</div>
                              <div className="bca-detail-value">{b.customerName}</div>
                            </div>
                            <div className="bca-detail-item">
                              <div className="bca-detail-label">Mobile Number</div>
                              <div className="bca-detail-value">
                                <a href={`tel:${b.customerPhone}`} className="bca-phone-link">
                                  📞 {b.customerPhone}
                                </a>
                              </div>
                            </div>
                            <div className="bca-detail-item">
                              <div className="bca-detail-label">Branch</div>
                              <div className="bca-detail-value">{b.branch}</div>
                            </div>
                            <div className="bca-detail-item">
                              <div className="bca-detail-label">Date & Time</div>
                              <div className="bca-detail-value">{b.date} at {b.time}</div>
                            </div>
                            <div className="bca-detail-item bca-detail-full">
                              <div className="bca-detail-label">Services Booked</div>
                              <div className="bca-services-list">
                                {(b.services || []).map((s, si) => (
                                  <span key={si} className="bca-svc-tag">
                                    {s.name} — ₹{s.price}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="bca-detail-item">
                              <div className="bca-detail-label">Total Amount</div>
                              <div className="bca-detail-value bca-total">₹{b.total}</div>
                            </div>
                            <div className="bca-detail-item">
                              <div className="bca-detail-label">Booked On</div>
                              <div className="bca-detail-value">
                                {b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : "—"}
                              </div>
                            </div>
                          </div>

                          <div className="bca-actions">
                            <a
                              href={`https://wa.me/91${b.customerPhone}?text=${encodeURIComponent(
                                `Hi ${b.customerName}, your appointment at Lovely Mens Beauty Parlour is confirmed!\n\nDate: ${b.date}\nTime: ${b.time}\nBranch: ${b.branch?.split("—")[0]}\nServices: ${svcList}\nTotal: Rs.${b.total}\n\nThank you!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bca-wa-btn"
                            >
                              💬 WhatsApp Customer
                            </a>
                            <a href={`tel:${b.customerPhone}`} className="bca-call-btn">
                              📞 Call Customer
                            </a>
                            <button className="bca-del-btn" onClick={() => handleDelete(b.id)}>
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TODAY TAB ── */}
        {activeTab === "today" && (
          <div>
            <div className="today-header">
              <h3>📆 Today's Appointments — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
            </div>
            {(() => {
              const todayStr    = new Date().toISOString().split("T")[0];
              const todayBkgs   = bookings.filter((b) => b.date === todayStr)
                .sort((a, b) => a.time.localeCompare(b.time));

              if (todayBkgs.length === 0) return (
                <div className="admin-empty">No bookings scheduled for today.</div>
              );

              return (
                <div className="today-timeline">
                  {todayBkgs.map((b, i) => {
                    const isPast  = new Date(`${b.date} ${b.time}`) < now;
                    const svcList = (b.services || []).map((s) => s.name).join(", ");
                    return (
                      <div key={b.id} className={`today-item ${isPast ? "ti-past" : "ti-upcoming"}`}>
                        <div className="ti-time-col">
                          <div className="ti-time">{b.time}</div>
                          <div className={`ti-dot ${isPast ? "dot-done" : "dot-upcoming"}`}></div>
                          {i < todayBkgs.length - 1 && <div className="ti-line"></div>}
                        </div>
                        <div className="ti-content">
                          <div className="ti-name">{b.customerName}</div>
                          <div className="ti-phone">📞 {b.customerPhone}</div>
                          <div className="ti-services">✂️ {svcList}</div>
                          <div className="ti-branch">{b.branch?.split("—")[0]}</div>
                          <div className="ti-amount">₹{b.total}</div>
                        </div>
                        <div className="ti-actions">
                          <a
                            href={`https://wa.me/91${b.customerPhone}?text=${encodeURIComponent(`Hi ${b.customerName}, your appointment today at ${b.time} is confirmed. See you soon! — Lovely Mens Beauty Parlour`)}`}
                            target="_blank" rel="noreferrer"
                            className="ti-wa"
                          >💬</a>
                          <a href={`tel:${b.customerPhone}`} className="ti-call">📞</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === "customers" && (
          <div>
            {customers.length === 0 ? (
              <div className="admin-empty">No customers yet.</div>
            ) : (
              <div className="customers-grid">
                {customers.map((c, i) => {
                  const cBookings = bookings.filter((b) => b.customerPhone === c.customerPhone);
                  const cTotal    = cBookings.reduce((s, b) => s + (b.total || 0), 0);
                  const lastVisit = cBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                  return (
                    <div key={i} className="customer-card">
                      <div className="cc-avatar">{c.customerName?.charAt(0)?.toUpperCase()}</div>
                      <div className="cc-info">
                        <div className="cc-name">{c.customerName}</div>
                        <div className="cc-phone">📞 {c.customerPhone}</div>
                        <div className="cc-stats">
                          <span className="cc-stat-badge">🗓 {cBookings.length} visit{cBookings.length !== 1 ? "s" : ""}</span>
                          <span className="cc-stat-badge gold">💰 ₹{cTotal}</span>
                        </div>
                        {lastVisit && (
                          <div className="cc-last">Last: {lastVisit.date} at {lastVisit.time}</div>
                        )}
                      </div>
                      <div className="cc-actions">
                        <a
                          href={`https://wa.me/91${c.customerPhone}`}
                          target="_blank" rel="noreferrer"
                          className="cc-wa"
                        >💬</a>
                        <a href={`tel:${c.customerPhone}`} className="cc-call">📞</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {activeTab === "services" && (
          <div className="svc-admin-grid">
            {services.map((s) => (
              <div key={s.id} className="svc-admin-card">
                {editingSvc?.id === s.id ? (
                  <div className="edit-form">
                    <input className="edit-inp" value={editingSvc.name}
                      onChange={(e) => setEditingSvc({ ...editingSvc, name: e.target.value })} placeholder="Name" />
                    <input className="edit-inp" type="number" value={editingSvc.price}
                      onChange={(e) => setEditingSvc({ ...editingSvc, price: Number(e.target.value) })} placeholder="Price" />
                    <textarea className="edit-ta" value={editingSvc.description}
                      onChange={(e) => setEditingSvc({ ...editingSvc, description: e.target.value })} />
                    <div className="edit-acts">
                      <button className="btn-primary save-btn" onClick={() => handleSaveSvc(editingSvc)}>✅ Save</button>
                      <button className="btn-outline cancel-btn" onClick={() => setEditingSvc(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="sa-icon">{s.icon}</div>
                    <div className="sa-name">{s.name}</div>
                    <div className="sa-price">₹{s.minPrice !== s.maxPrice ? `${s.minPrice}–${s.maxPrice}` : s.price}</div>
                    <div className="sa-desc">{s.description}</div>
                    <button className="btn-outline edit-svc-btn" onClick={() => setEditingSvc({ ...s })}>✏️ Edit</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
