import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AdminDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if admin is logged in
  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true") {
      navigate("/admin");
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookRes, svcRes] = await Promise.all([
        fetch(`${API_URL}/api/bookings`),
        fetch(`${API_URL}/api/services`),
      ]);
      setBookings(await bookRes.json());
      setServices(await svcRes.json());
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminPhone");
    navigate("/admin");
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    await fetch(`${API_URL}/api/bookings/${id}`, { method: "DELETE" });
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSaveService = async (service) => {
    await fetch(`${API_URL}/api/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
    setEditingService(null);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-header-inner">
          <div>
            <div className="gold-badge" style={{ marginBottom: "4px" }}>Admin Panel</div>
            <h1>Lovely Mens Beauty Parlour</h1>
          </div>
          <button className="btn-outline logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-num">{bookings.length}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon">✂️</div>
          <div className="stat-num">{services.length}</div>
          <div className="stat-label">Services</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-num">
            ₹{bookings.reduce((sum, b) => sum + (b.total || 0), 0).toLocaleString()}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-num">2</div>
          <div className="stat-label">Active Branches</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-body">
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
            📅 Bookings ({bookings.length})
          </button>
          <button className={`admin-tab ${activeTab === "services" ? "active" : ""}`} onClick={() => setActiveTab("services")}>
            ✂️ Services
          </button>
        </div>

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="admin-tab-content">
            {bookings.length === 0 ? (
              <div className="admin-empty">No bookings yet.</div>
            ) : (
              <div className="bookings-table-wrap">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Branch</th>
                      <th>Services</th>
                      <th>Date & Time</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={b.id}>
                        <td>{i + 1}</td>
                        <td>{b.customerName}</td>
                        <td>{b.customerPhone}</td>
                        <td className="branch-cell">{b.branch?.split("—")[0]}</td>
                        <td>{b.services?.map((s) => s.name).join(", ")}</td>
                        <td>{b.date} <br /><span style={{ color: "#c9a84c" }}>{b.time}</span></td>
                        <td className="amount-cell">₹{b.total}</td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteBooking(b.id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === "services" && (
          <div className="admin-tab-content">
            <div className="services-admin-grid">
              {services.map((s) => (
                <div key={s.id} className="service-admin-card">
                  {editingService?.id === s.id ? (
                    // Edit Form
                    <div className="service-edit-form">
                      <input className="edit-input" value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} placeholder="Service Name" />
                      <input className="edit-input" type="number" value={editingService.price}
                        onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })} placeholder="Price" />
                      <textarea className="edit-textarea" value={editingService.description}
                        onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} placeholder="Description" />
                      <div className="edit-actions">
                        <button className="btn-primary save-btn" onClick={() => handleSaveService(editingService)}>✅ Save</button>
                        <button className="btn-outline cancel-btn" onClick={() => setEditingService(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    // Display Card
                    <>
                      <div className="svc-icon">{s.icon}</div>
                      <div className="svc-name">{s.name}</div>
                      <div className="svc-price">₹{s.price}{s.minPrice !== s.maxPrice ? `–₹${s.maxPrice}` : ""}</div>
                      <div className="svc-desc">{s.description}</div>
                      <button className="edit-svc-btn btn-outline" onClick={() => setEditingService({ ...s })}>✏️ Edit</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
