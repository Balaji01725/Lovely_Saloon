import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function LoginPage({ onLogin }) {
  const [step,      setStep]      = useState("phone"); // "phone" | "otp"
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const navigate = useNavigate();

  // Start 60s resend countdown
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // ── Send OTP ────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone))
      return setError("Please enter a valid 10-digit Indian mobile number.");
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
        setSuccess(`OTP sent to ${phone.slice(0,2)}XXXXXX${phone.slice(-2)}`);
        startCountdown();
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      } else {
        setError(data.error || "Failed to send OTP. Try again.");
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally { setLoading(false); }
  };

  // ── OTP input handler ───────────────────────────────────
  const handleOTPChange = (index, value) => {
    const val = value.replace(/\D/, "");
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) otpRefs[index + 1].current?.focus();
    // Auto-verify when all 6 digits entered
    if (newOtp.every((d) => d !== "") && val) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // ── Verify OTP ──────────────────────────────────────────
  const handleVerifyOTP = async (otpValue) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) return setError("Please enter the 6-digit OTP.");
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.phone, data.role);
        navigate(data.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        setError(data.error || "Incorrect OTP.");
        setOtp(["", "", "", "", "", ""]);
        otpRefs[0].current?.focus();
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-circle c1"></div>
        <div className="login-bg-circle c2"></div>
      </div>

      <div className="login-box">
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo.png" alt="Lovely Mens Beauty Parlour" />
        </div>
        <div className="gold-badge" style={{ marginBottom: "8px" }}>
          {step === "phone" ? "Welcome" : "Verification"}
        </div>
        <h1 className="login-title">
          {step === "phone" ? "Sign In" : "Enter OTP"}
        </h1>
        <div className="gold-divider" style={{ margin: "10px auto 20px" }}></div>
        <p className="login-sub">
          {step === "phone"
            ? "Enter your mobile number to receive a verification code"
            : `We sent a 6-digit OTP to ${phone.slice(0,2)}XXXXXX${phone.slice(-2)}`}
        </p>

        {error   && <div className="login-error">⚠️ {error}</div>}
        {success && <div className="login-success">✅ {success}</div>}

        {/* PHONE STEP */}
        {step === "phone" && (
          <div className="login-form">
            <div className="phone-input-wrap">
              <span className="phone-flag">🇮🇳 +91</span>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                className="phone-input"
              />
            </div>
            <button
              className="btn-primary login-btn"
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
            >
              {loading ? "⏳ Sending OTP..." : "📱 Send OTP"}
            </button>
            <p className="login-note">
              OTP will be sent via SMS to your mobile number
            </p>
          </div>
        )}

        {/* OTP STEP */}
        {step === "otp" && (
          <div className="login-form">
            <div className="otp-boxes">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(i, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(i, e)}
                  className="otp-box"
                />
              ))}
            </div>

            <button
              className="btn-primary login-btn"
              onClick={() => handleVerifyOTP()}
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? "⏳ Verifying..." : "✅ Verify OTP"}
            </button>

            <div className="resend-wrap">
              {countdown > 0 ? (
                <span className="resend-timer">Resend OTP in {countdown}s</span>
              ) : (
                <button className="resend-btn" onClick={() => { setOtp(["","","","","",""]); handleSendOTP(); }}>
                  🔄 Resend OTP
                </button>
              )}
            </div>

            <button className="change-number-btn" onClick={() => { setStep("phone"); setError(""); setSuccess(""); setOtp(["","","","","",""]); }}>
              ← Change Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
