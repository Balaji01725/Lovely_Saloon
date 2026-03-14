// ============================================================
// Bookings Controller — Lovely Mens Beauty Parlour
// ============================================================
// VERCEL FIX:
// Vercel serverless functions CANNOT write to files.
// So we use in-memory array for storing bookings.
// SMS and WhatsApp still work perfectly.
// Bookings show in admin during the session.
// ============================================================

const https = require("https");

// In-memory bookings store (works on Vercel)
let bookingsStore = [];

// ── Build plain SMS text (no emojis — Fast2SMS english route) ──
function buildSMSText(booking) {
  const serviceList = booking.services
    .map((s) => s.name + " (Rs." + s.price + ")")
    .join(", ");

  return (
    "New Booking - Lovely Mens Beauty Parlour\n" +
    "Customer: " + booking.customerName + "\n" +
    "Phone: " + booking.customerPhone + "\n" +
    "Branch: " + booking.branch + "\n" +
    "Services: " + serviceList + "\n" +
    "Total: Rs." + booking.total + "\n" +
    "Date: " + booking.date + "\n" +
    "Time: " + booking.time + "\n" +
    "Booked via website"
  );
}

// ── Build WhatsApp text (with emojis) ──
function buildWhatsAppText(booking) {
  const serviceList = booking.services
    .map((s) => s.name + " (Rs." + s.price + ")")
    .join(", ");

  return (
    "New Booking - Lovely Mens Beauty Parlour\n\n" +
    "Customer: " + booking.customerName + "\n" +
    "Phone: " + booking.customerPhone + "\n" +
    "Branch: " + booking.branch + "\n" +
    "Services: " + serviceList + "\n" +
    "Total: Rs." + booking.total + "\n" +
    "Date: " + booking.date + "\n" +
    "Time: " + booking.time + "\n\n" +
    "Sent via Lovely Mens Beauty Parlour Website"
  );
}

// ── Send SMS via Fast2SMS (non-blocking) ──
function sendSMS(smsText) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey || apiKey === "YOUR_FAST2SMS_KEY_HERE" || apiKey.trim() === "") {
    console.log("[SMS] No API key set — skipping SMS.");
    return;
  }

  const payload = JSON.stringify({
    route:     "q",
    sender_id: "FTSMS",
    message:   smsText,
    language:  "english",
    flash:     0,
    numbers:   "9442887267",
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

  const req = https.request(options, (res) => {
    let body = "";
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.return === true) {
          console.log("[SMS] Sent successfully to 9442887267");
        } else {
          console.error("[SMS] Fast2SMS error:", body);
        }
      } catch {
        console.log("[SMS] Response:", body);
      }
    });
  });

  req.on("error", (err) => {
    console.error("[SMS] Failed (non-blocking):", err.message);
  });

  req.setTimeout(8000, () => {
    console.error("[SMS] Timeout");
    req.destroy();
  });

  req.write(payload);
  req.end();
}

// ── GET /api/bookings ──
exports.getBookings = (req, res) => {
  try {
    res.json(bookingsStore);
  } catch (err) {
    res.status(500).json({ error: "Failed to get bookings" });
  }
};

// ── POST /api/bookings ──
exports.createBooking = (req, res) => {
  try {
    // Build booking object
    const newBooking = {
      id:            Date.now().toString(),
      customerName:  req.body.customerName  || "",
      customerPhone: req.body.customerPhone || "",
      branch:        req.body.branch        || "",
      date:          req.body.date          || "",
      time:          req.body.time          || "",
      services:      req.body.services      || [],
      total:         req.body.total         || 0,
      createdAt:     new Date().toISOString(),
    };

    // Save to memory (no file write — safe on Vercel)
    bookingsStore.push(newBooking);

    // Build messages
    const smsText = buildSMSText(newBooking);
    const waText  = buildWhatsAppText(newBooking);

    // Send SMS — non-blocking, response sent immediately after
    sendSMS(smsText);

    // Respond with success + WhatsApp link
    res.status(201).json({
      success:         true,
      booking:         newBooking,
      whatsappMessage: waText,
      whatsappLink:    "https://wa.me/919442887267?text=" + encodeURIComponent(waText),
    });

  } catch (err) {
    console.error("[Booking Error]", err.message);
    res.status(500).json({ error: "Failed to save booking: " + err.message });
  }
};

// ── DELETE /api/bookings/:id ──
exports.deleteBooking = (req, res) => {
  try {
    const before = bookingsStore.length;
    bookingsStore = bookingsStore.filter((b) => b.id !== req.params.id);

    if (bookingsStore.length === before) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
};
