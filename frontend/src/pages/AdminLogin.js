import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

// Only this phone number can login as admin
const ADMIN_PHONE = "9442887267";

function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (phone.trim() === ADMIN_PHONE) {
      // Store admin session in localStorage
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminPhone", phone);
      navigate("/admin/dashboard");
    } else {
      setError("Access denied. Only the owner can login as admin.");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <img src="/logo.png" alt="Logo" />
        </div>
        <div className="gold-badge" style={{ marginBottom: "12px" }}>Admin Access</div>
        <h1>Owner Login</h1>
        <div className="gold-divider" style={{ margin: "12px auto 24px" }}></div>
        <p className="admin-sub">Enter the owner's registered phone number to access the dashboard</p>

        {error && <div className="admin-error">⚠️ {error}</div>}

        <div className="admin-form">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <button className="btn-primary admin-login-btn" onClick={handleLogin}>
            🔓 Login as Admin
          </button>
        </div>

        <p className="admin-back"><a href="/">← Back to Website</a></p>
      </div>
    </div>
  );
}

export default AdminLogin;
