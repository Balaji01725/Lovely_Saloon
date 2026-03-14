// ============================================================
// Auth Controller — OTP Login via Fast2SMS
// ============================================================
const https = require("https");

const OWNER_PHONE = "9442887267";

// In-memory OTP store: { "9999999999": { otp:"123456", expiresAt: timestamp } }
const otpStore = {};

// ── Generate 6-digit OTP ─────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Core SMS function — tested & working with Fast2SMS ────
function sendSMS(toPhone, message) {
  return new Promise((resolve, reject) => {
    const apiKey = (process.env.FAST2SMS_API_KEY || "").trim();

    if (!apiKey || apiKey === "YOUR_FAST2SMS_KEY_HERE") {
      console.error("[SMS] FAST2SMS_API_KEY not set in environment variables!");
      return reject(new Error("SMS API key not configured. Add FAST2SMS_API_KEY in Vercel environment variables."));
    }

    // Fast2SMS only accepts plain ASCII — strip any special chars
    const cleanMsg = message
      .replace(/[^\x00-\x7F]/g, "")
      .trim();

    // Fast2SMS Quick SMS API payload
    const payload = JSON.stringify({
      route:     "q",
      sender_id: "FTSMS",
      message:   cleanMsg,
      language:  "english",
      flash:     0,
      numbers:   toPhone,
    });

    const options = {
      hostname: "www.fast2sms.com",
      path:     "/dev/bulkV2",
      method:   "POST",
      headers: {
        "authorization":  apiKey,
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Cache-Control":  "no-cache",
      },
    };

    console.log("[SMS] Calling Fast2SMS API...");
    console.log("[SMS] To:", toPhone);
    console.log("[SMS] Message:", cleanMsg);

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data",  (chunk) => { body += chunk; });
      res.on("end", () => {
        console.log("[SMS] HTTP Status:", res.statusCode);
        console.log("[SMS] Response:", body);
        try {
          const parsed = JSON.parse(body);
          if (parsed.return === true) {
            console.log("[SMS] SUCCESS — Request ID:", parsed.request_id);
            resolve({ success: true, requestId: parsed.request_id });
          } else {
            console.error("[SMS] FAILED — Error:", JSON.stringify(parsed));
            reject(new Error(
              Array.isArray(parsed.message)
                ? parsed.message.join(", ")
                : (parsed.message || "Unknown Fast2SMS error")
            ));
          }
        } catch (e) {
          console.error("[SMS] Parse error:", e.message, "Body:", body);
          reject(new Error("Invalid response from Fast2SMS: " + body));
        }
      });
    });

    req.on("error", (err) => {
      console.error("[SMS] Network error:", err.message);
      reject(err);
    });

    req.setTimeout(12000, () => {
      console.error("[SMS] Timeout after 12s");
      req.destroy();
      reject(new Error("SMS request timed out"));
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

  const message = `Lovely Mens Beauty Parlour OTP: ${otp}. Valid 5 mins. Do not share.`;

  try {
    await sendSMS(phone, message);
    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (err) {
    console.error("[OTP] SMS send failed:", err.message);
    res.status(500).json({
      error: "Failed to send OTP: " + err.message,
    });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────
exports.verifyOTP = (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required." });
  }

  const stored = otpStore[phone];

  if (!stored) {
    return res.status(400).json({ error: "No OTP found. Please request a new one." });
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ error: "OTP expired. Please request a new one." });
  }

  if (stored.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: "Incorrect OTP. Please try again." });
  }

  // OTP correct — clear it
  delete otpStore[phone];

  const isOwner = phone === OWNER_PHONE;

  res.json({
    success: true,
    phone,
    isOwner,
    role:    isOwner ? "admin" : "user",
    message: isOwner ? "Welcome Owner!" : "Login successful!",
  });
};
