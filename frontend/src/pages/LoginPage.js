import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function LoginPage({ onLogin }) {
  const [step,      setStep]      = useState("phone");
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState(["","","","","",""]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [otpInfo,   setOtpInfo]   = useState(null);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  // ── Send OTP ────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone))
      return setError("Please enter a valid 10-digit mobile number.");
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/send-otp`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpInfo({ smsSent: data.smsSent, otp: data.otp });
        setStep("otp");
        startCountdown();
      } else {
        setError(data.error || "Failed to send OTP. Try again.");
      }
    } catch { setError("Cannot connect to server. Try again."); }
    finally { setLoading(false); }
  };

  // ── Verify OTP ──────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) return setError("Please enter all 6 digits.");
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone, otp: otpStr }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("lmbp_phone",    data.phone);
        localStorage.setItem("lmbp_role",     data.role);
        localStorage.setItem("lmbp_loggedIn", "true");
        onLogin(data.phone, data.role);
        navigate(data.isOwner ? "/admin/dashboard" : "/");
      } else {
        setError(data.error || "Wrong OTP. Please try again.");
        setOtp(["","","","","",""]);
        otpRefs.current[0]?.focus();
      }
    } catch { setError("Cannot connect to server. Try again."); }
    finally { setLoading(false); }
  };

  // ── OTP digit input handler ────────────────────────────
  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/, "");
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    // Auto-advance
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (val && index === 5) {
      const filled = newOtp.join("");
      if (filled.length === 6) setTimeout(handleVerifyOTP, 100);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifyOTP();
  };

  // Tap the big OTP code to auto-fill
  const handleAutoFill = () => {
    if (!otpInfo?.otp) return;
    const digits = otpInfo.otp.split("");
    setOtp(digits);
    otpRefs.current[5]?.focus();
  };

  // Countdown timer
  const startCountdown = () => {
    setCountdown(30);
    const iv = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
  };

  const handleResend = () => {
    setOtp(["","","","","",""]);
    setError("");
    setOtpInfo(null);
    handleSendOTP();
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtp(["","","","","",""]);
    setError("");
    setOtpInfo(null);
    setCountdown(0);
  };

  const otpStr = otp.join("");

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb orb1"></div>
        <div className="login-bg-orb orb2"></div>
        <div className="login-bg-orb orb3"></div>
      </div>

      <div className="login-box">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-ring"></div>
          <div className="login-logo-img">
            <img src="/logo.png" alt="Lovely Mens Beauty Parlour" />
          </div>
        </div>

        {/* Progress dots */}
        <div className="login-progress">
          <div className={`progress-dot ${step === "phone" ? "active" : ""}`}></div>
          <div className={`progress-dot ${step === "otp" ? "active" : ""}`}></div>
        </div>

        {/* Badge */}
        <div className="login-badge">
          ✦ Lovely Mens Beauty Parlour
        </div>

        {/* Title */}
        <h1 className="login-title">
          {step === "phone" ? "Welcome Back" : "Verify OTP"}
        </h1>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line"></div>
          <div className="login-divider-dot"></div>
          <div className="login-divider-line"></div>
        </div>

        {/* Subtitle */}
        <p className="login-subtitle">
          {step === "phone"
            ? "Enter your mobile number to receive a one-time password and access your account."
            : `A 6-digit OTP has been sent to`}
        </p>

        {step === "otp" && (
          <div className="otp-phone-display">
            🇮🇳 +91 {phone}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="login-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── PHONE STEP ── */}
        {step === "phone" && (
          <div className="login-form">
            <div className="phone-input-wrap">
              <div className="phone-prefix">
                <span className="phone-flag">🇮🇳</span>
                <span className="phone-prefix-text">+91</span>
              </div>
              <input
                className="phone-input-field"
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/,"").slice(0,10)); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                autoFocus
              />
              {phone.length === 10 && (
                <div className="phone-check">✅</div>
              )}
            </div>

            <button
              className="send-otp-btn"
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Sending OTP...
                </span>
              ) : "📱 Send OTP"}
            </button>
          </div>
        )}

        {/* ── OTP STEP ── */}
        {step === "otp" && (
          <div className="login-form">
            {/* OTP display box */}
            {otpInfo && (
              <div className={`otp-display-box ${otpInfo.smsSent ? "sms-sent" : "sms-fallback"}`}>
                {otpInfo.smsSent ? (
                  <>
                    <div className="otp-box-icon">📱</div>
                    <div className="otp-box-label">OTP sent to your phone</div>
                    <div className="otp-tap-hint">Check your SMS inbox</div>
                  </>
                ) : (
                  <>
                    <div className="otp-box-icon">🔐</div>
                    <div className="otp-box-label">Your OTP</div>
                    <div className="otp-big-code" onClick={handleAutoFill}>
                      {otpInfo.otp}
                    </div>
                    <div className="otp-tap-hint">👆 Tap to auto-fill</div>
                    <div className="otp-sms-note">
                      ℹ️ SMS needs Fast2SMS wallet recharge (₹100). OTP shown here so you can login now.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* OTP digit boxes */}
            <div className="otp-input-row">
              {[0,1,2,3,4,5].map((i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  className={`otp-digit ${otp[i] ? "filled" : ""}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              className="verify-otp-btn"
              onClick={handleVerifyOTP}
              disabled={loading || otpStr.length !== 6}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" style={{ borderTopColor:"#fff", borderColor:"rgba(255,255,255,0.3)" }}></span>
                  Verifying...
                </span>
              ) : "✅ Verify & Login"}
            </button>

            {/* Resend + Change number */}
            <div className="otp-bottom-row">
              {countdown > 0 ? (
                <div className="resend-countdown">
                  <div className="countdown-ring"></div>
                  <span>Resend in {countdown}s</span>
                </div>
              ) : (
                <button className="resend-btn" onClick={handleResend}>
                  🔄 Resend OTP
                </button>
              )}
              <button className="change-number-btn" onClick={handleChangeNumber}>
                ✏️ Change Number
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer-note">
          <span>🔒</span>
          <span>Your number is used only for booking verification</span>
        </div>

        <div className="login-brand-strip">
          <span>Lovely Mens Beauty Parlour</span>
          <span>·</span>
          <strong>Sathankulam</strong>
          <span>·</span>
          <span>Est. 1999</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
