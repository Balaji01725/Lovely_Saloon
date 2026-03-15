// ============================================================
// Auth Controller — OTP Login
// ============================================================
// Fast2SMS requires ₹100 minimum recharge to use API.
// Until then, OTP is shown directly on screen as fallback.
// After recharge, OTP also arrives via SMS on phone.
// ============================================================

const https = require("https");

// In-memory OTP store { phone: { otp, expiresAt } }
const otpStore = {};

const OWNER_PHONE = "9442887267";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Fast2SMS — returns true if sent, false if failed
function sendOTPviaSMS(phone, otp) {
  return new Promise((resolve) => {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey || apiKey === "YOUR_FAST2SMS_KEY_HERE" || apiKey.trim() === "") {
      console.log("[OTP SMS] No API key — SMS skipped");
      return resolve(false);
    }

    // Plain ASCII only — no emojis
    const message = `Your OTP for Lovely Mens Beauty Parlour login is ${otp}. Valid for 5 minutes. Do not share.`;

    const payload = JSON.stringify({
      route:     "q",
      sender_id: "FTSMS",
      message:   message,
      language:  "english",
      flash:     0,
      numbers:   phone,
    });

    console.log("[OTP SMS] Sending to:", phone);

    const options = {
      hostname: "www.fast2sms.com",
      path:     "/dev/bulkV2",
      method:   "POST",
      headers:  {
        "authorization":  apiKey.trim(),
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Cache-Control":  "no-cache",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data",  (c) => { body += c; });
      res.on("end",   () => {
        console.log("[OTP SMS] Response:", body);
        try {
          const parsed = JSON.parse(body);
          if (parsed.return === true) {
            console.log("[OTP SMS] Sent OK to", phone);
            resolve(true);
          } else {
            console.log("[OTP SMS] Failed:", parsed.message || body);
            resolve(false);
          }
        } catch {
          console.log("[OTP SMS] Parse error:", body);
          resolve(false);
        }
      });
    });

    req.on("error", (e) => {
      console.log("[OTP SMS] Error:", e.message);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log("[OTP SMS] Timeout");
      req.destroy();
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// ── POST /api/auth/send-otp ───────────────────────────────
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({
      error: "Please enter a valid 10-digit Indian mobile number.",
    });
  }

  const otp       = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Save OTP
  otpStore[phone] = { otp, expiresAt };

  console.log(`[OTP] Generated for ${phone}: ${otp}`);

  // Try to send SMS — non-blocking, won't fail the response
  const smsSent = await sendOTPviaSMS(phone, otp);

  // Always return success with OTP shown on screen
  // This way login works even before Fast2SMS recharge
  res.json({
    success:  true,
    smsSent:  smsSent,
    // OTP shown on screen so users can login immediately
    // After Fast2SMS recharge (₹100), OTP also arrives via SMS
    otp:      otp,
    message:  smsSent
      ? `OTP sent to ${phone} via SMS`
      : `OTP generated for ${phone}`,
  });
};

// ── POST /api/auth/verify-otp ─────────────────────────────
exports.verifyOTP = (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required." });
  }

  const stored = otpStore[phone];

  if (!stored) {
    return res.status(400).json({
      error: "OTP not found. Please request a new OTP.",
    });
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({
      error: "OTP has expired. Please request a new one.",
    });
  }

  if (stored.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: "Incorrect OTP. Please try again." });
  }

  // Success — clean up
  delete otpStore[phone];

  const isOwner = phone === OWNER_PHONE;

  res.json({
    success: true,
    phone,
    isOwner,
    role:    isOwner ? "admin" : "user",
    message: isOwner ? "Welcome, Owner!" : "Login successful!",
  });
};
