// ============================================================
// Login Page — Phone + OTP Authentication
// Shows OTP on screen if SMS not sent (Fast2SMS not recharged)
// After ₹100 recharge, OTP also arrives via SMS on phone
// ============================================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function LoginPage({ onLogin }) {
  const [step,       setStep]       = useState("phone");
  const [phone,      setPhone]      = useState("");
  const [otp,        setOtp]        = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [otpInfo,    setOtpInfo]    = useState(null); // { smsSent, otp }
  const [countdown,  setCountdown]  = useState(0);
  const navigate = useNavigate();

  // ── Send OTP ─────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return setError("Please enter a valid 10-digit Indian mobile number.");
    }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpInfo({ smsSent: data.smsSent, otp: data.otp });
        setStep("otp");
        startCountdown();
      } else {
        setError(data.error || "Failed to generate OTP. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return setError("Please enter the 6-digit OTP.");
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("lmbp_phone",    data.phone);
        localStorage.setItem("lmbp_role",     data.role);
        localStorage.setItem("lmbp_loggedIn", "true");
        onLogin(data.phone, data.role);
        navigate(data.isOwner ? "/admin/dashboard" : "/");
      } else {
        setError(data.error || "Invalid OTP. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill OTP if shown on screen
  const handleUseOTP = () => {
    if (otpInfo?.otp) setOtp(otpInfo.otp);
  };

  const startCountdown = () => {
    setCountdown(30);
    const iv = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
  };

  const handleResend = () => {
    setOtp("");
    setError("");
    setOtpInfo(null);
    handleSendOTP();
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img src="/logo.png" alt="Lovely Mens Beauty Parlour" />
        </div>

        <div className="gold-badge" style={{ marginBottom: "10px" }}>
          {step === "phone" ? "Welcome" : "Verification"}
        </div>
        <h1 className="login-title">
          {step === "phone" ? "Sign In / Sign Up" : "Enter OTP"}
        </h1>
        <div className="gold-divider" style={{ margin: "12px auto 20px" }}></div>

        <p className="login-sub">
          {step === "phone"
            ? "Enter your mobile number to get a one-time password"
            : `Enter the 6-digit OTP for +91 ${phone}`}
        </p>

        {error && <div className="login-error">⚠️ {error}</div>}

        {/* ── PHONE STEP ── */}
        {step === "phone" && (
          <div className="login-form">
            <div className="input-with-prefix">
              <span className="prefix">+91</span>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                autoFocus
              />
            </div>
            <button
              className="btn-primary login-btn"
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
            >
              {loading ? "⏳ Sending OTP..." : "📱 Send OTP"}
            </button>
          </div>
        )}

        {/* ── OTP STEP ── */}
        {step === "otp" && (
          <div className="login-form">

            {/* OTP display box — shows OTP on screen */}
            {otpInfo && (
              <div className={`otp-display-box ${otpInfo.smsSent ? "sms-sent" : "sms-fallback"}`}>
                {otpInfo.smsSent ? (
                  <>
                    <div className="otp-display-icon">📱</div>
                    <div className="otp-display-title">OTP sent to your phone</div>
                    <div className="otp-display-sub">Check your SMS inbox for the 6-digit OTP</div>
                  </>
                ) : (
                  <>
                    <div className="otp-display-icon">🔐</div>
                    <div className="otp-display-title">Your OTP is</div>
                    <div className="otp-display-code" onClick={handleUseOTP}>
                      {otpInfo.otp}
                    </div>
                    <div className="otp-display-sub">
                      Tap the number above to auto-fill
                    </div>
                    <div className="otp-sms-note">
                      ℹ️ SMS delivery requires Fast2SMS wallet recharge (₹100).
                      Your OTP is shown here so you can login now.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* OTP input boxes */}
            <div className="otp-inputs">
              {[0,1,2,3,4,5].map((i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-box"
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val    = e.target.value.replace(/\D/, "");
                    const arr    = otp.split("");
                    arr[i]       = val;
                    const newOtp = arr.join("").slice(0, 6);
                    setOtp(newOtp);
                    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0)
                      document.getElementById(`otp-${i-1}`)?.focus();
                    if (e.key === "Enter" && otp.length === 6) handleVerifyOTP();
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              className="btn-primary login-btn"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
            >
              {loading ? "⏳ Verifying..." : "✅ Verify & Login"}
            </button>

            <div className="resend-row">
              {countdown > 0 ? (
                <span className="resend-wait">Resend in {countdown}s</span>
              ) : (
                <button className="resend-btn" onClick={handleResend}>🔄 Resend OTP</button>
              )}
              <button
                className="change-number"
                onClick={() => { setStep("phone"); setOtp(""); setError(""); setOtpInfo(null); }}
              >
                ✏️ Change Number
              </button>
            </div>
          </div>
        )}

        <p className="login-note">
          🔒 Your number is only used for booking verification. No spam ever.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
