// ============================================================
// Bookings Controller — Lovely Mens Beauty Parlour
// ============================================================
//
// SMS SETUP:
// 1. Go to https://www.fast2sms.com → Sign Up Free
// 2. Login → Dev API (left sidebar) → Copy your API key
// 3. Open backend/.env → paste key as FAST2SMS_API_KEY=yourkey
// ============================================================

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const bookingsPath = path.join(__dirname, "../data/bookings.json");

// Read bookings from JSON file
function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(bookingsPath, "utf-8"));
  } catch {
    return [];
  }
}

// Write bookings to JSON file
function writeBookings(data) {
  fs.writeFileSync(bookingsPath, JSON.stringify(data, null, 2));
}

// Build plain-text SMS message (no emojis for SMS)
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

// Build WhatsApp message (with emojis)
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

// Send SMS to owner via Fast2SMS — NON BLOCKING
function sendSMS(smsText) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey || apiKey === "YOUR_FAST2SMS_KEY_HERE" || apiKey.trim() === "") {
    console.log("[SMS] No Fast2SMS key in .env — skipping SMS.");
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
          console.log("[SMS] Sent to owner 9442887267. Request ID:", parsed.request_id);
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
    console.error("[SMS] Timeout — booking still saved.");
    req.destroy();
  });

  req.write(payload);
  req.end();
}

// GET /api/bookings — return all bookings (admin)
exports.getBookings = (req, res) => {
  try {
    res.json(readBookings());
  } catch (err) {
    res.status(500).json({ error: "Failed to read bookings" });
  }
};

// POST /api/bookings — save booking + send SMS + return WhatsApp link
exports.createBooking = (req, res) => {
  try {
    const bookings = readBookings();

    const newBooking = {
      id:            Date.now().toString(),
      customerName:  req.body.customerName,
      customerPhone: req.body.customerPhone,
      branch:        req.body.branch,
      date:          req.body.date,
      time:          req.body.time,
      services:      req.body.services,
      total:         req.body.total,
      createdAt:     new Date().toISOString(),
    };

    bookings.push(newBooking);
    writeBookings(bookings);

    const smsText = buildSMSText(newBooking);
    const waText  = buildWhatsAppText(newBooking);

    // Fire SMS — non-blocking, booking already saved
    sendSMS(smsText);

    res.status(201).json({
      success:         true,
      booking:         newBooking,
      whatsappMessage: waText,
      whatsappLink:    "https://wa.me/919442887267?text=" + encodeURIComponent(waText),
    });

  } catch (err) {
    console.error("[Booking Error]", err);
    res.status(500).json({ error: "Failed to save booking." });
  }
};

// DELETE /api/bookings/:id — delete booking (admin)
exports.deleteBooking = (req, res) => {
  try {
    let bookings = readBookings();
    const index  = bookings.findIndex((b) => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }

    bookings.splice(index, 1);
    writeBookings(bookings);
    res.json({ success: true, message: "Booking deleted" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
};
