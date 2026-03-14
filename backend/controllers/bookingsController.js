// ============================================================
// Bookings Controller — Lovely Mens Beauty Parlour
// Features:
//   - Slot blocking: same date + time = "Already Booked"
//   - Slot auto-releases after appointment time passes
//   - SMS via Fast2SMS
//   - WhatsApp link
// ============================================================

const https = require("https");

// In-memory store (Vercel serverless safe)
let bookingsStore = [];

// ── Check if a slot is already booked ──────────────────────
function isSlotTaken(branch, date, time) {
  const now = new Date();
  return bookingsStore.some((b) => {
    // Skip past bookings — slot is free again after the time passes
    const bookingDateTime = new Date(`${b.date} ${convertTo24(b.time)}`);
    if (bookingDateTime < now) return false;
    return b.branch === branch && b.date === date && b.time === time;
  });
}

// Convert "10:30 AM" → "10:30" for Date parsing
function convertTo24(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// ── Get all booked slots for a branch + date (for frontend) ──
exports.getBookedSlots = (req, res) => {
  const { branch, date } = req.query;
  if (!branch || !date) return res.json({ bookedSlots: [] });

  const now = new Date();
  const booked = bookingsStore
    .filter((b) => {
      const bookingDateTime = new Date(`${b.date} ${convertTo24(b.time)}`);
      return (
        b.branch === branch &&
        b.date === date &&
        bookingDateTime >= now
      );
    })
    .map((b) => b.time);

  res.json({ bookedSlots: booked });
};

// ── Build SMS text ─────────────────────────────────────────
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

// ── Build WhatsApp text ────────────────────────────────────
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

// ── Send SMS via Fast2SMS ──────────────────────────────────
function sendSMS(smsText) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey || apiKey === "YOUR_FAST2SMS_KEY_HERE" || apiKey.trim() === "") {
    console.log("[SMS] No API key — skipping.");
    return;
  }

  const payload = JSON.stringify({
    route: "q", sender_id: "FTSMS",
    message: smsText, language: "english",
    flash: 0, numbers: "9442887267",
  });

  const req = https.request({
    hostname: "www.fast2sms.com", path: "/dev/bulkV2", method: "POST",
    headers: {
      "authorization": apiKey, "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload), "Cache-Control": "no-cache",
    },
  }, (res) => {
    let body = "";
    res.on("data", (c) => body += c);
    res.on("end", () => {
      try {
        const p = JSON.parse(body);
        console.log(p.return ? "[SMS] Sent OK" : "[SMS] Error: " + body);
      } catch { console.log("[SMS]", body); }
    });
  });

  req.on("error", (e) => console.error("[SMS] Failed:", e.message));
  req.setTimeout(8000, () => { req.destroy(); });
  req.write(payload);
  req.end();
}

// ── GET /api/bookings ──────────────────────────────────────
exports.getBookings = (req, res) => {
  res.json(bookingsStore);
};

// ── POST /api/bookings ─────────────────────────────────────
exports.createBooking = (req, res) => {
  try {
    const { customerName, customerPhone, branch, date, time, services, total } = req.body;

    // ✅ Check if slot already taken
    if (isSlotTaken(branch, date, time)) {
      return res.status(409).json({
        success: false,
        slotTaken: true,
        error: `This time slot (${time} on ${date}) is already booked at ${branch}. Please choose a different time.`,
      });
    }

    const newBooking = {
      id: Date.now().toString(),
      customerName, customerPhone, branch, date, time,
      services: services || [], total: total || 0,
      createdAt: new Date().toISOString(),
    };

    bookingsStore.push(newBooking);

    const smsText = buildSMSText(newBooking);
    const waText  = buildWhatsAppText(newBooking);

    sendSMS(smsText);

    res.status(201).json({
      success: true, booking: newBooking,
      whatsappMessage: waText,
      whatsappLink: "https://wa.me/919442887267?text=" + encodeURIComponent(waText),
    });

  } catch (err) {
    console.error("[Booking Error]", err.message);
    res.status(500).json({ error: "Failed to save booking: " + err.message });
  }
};

// ── DELETE /api/bookings/:id ───────────────────────────────
exports.deleteBooking = (req, res) => {
  try {
    const before = bookingsStore.length;
    bookingsStore = bookingsStore.filter((b) => b.id !== req.params.id);
    if (bookingsStore.length === before)
      return res.status(404).json({ error: "Booking not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
};
