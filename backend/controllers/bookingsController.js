// ============================================================
// Bookings Controller
// Rules:
//   AC Branch    → max 2 bookings per slot
//   Non-AC Branch→ max 1 booking per slot
//   Slot auto-releases after appointment time passes
//   SMS sent to owner on every new booking
// ============================================================
const https = require("https");

const OWNER_PHONE = "9442887267";

// Slot limits per branch
const SLOT_LIMIT = {
  AC:    2,
  NONAC: 1,
};

// In-memory bookings store
let bookingsStore = [];

// ── Get slot limit for a branch ───────────────────────────
function getSlotLimit(branch) {
  if (branch && branch.toLowerCase().includes("ac branch")) return SLOT_LIMIT.AC;
  return SLOT_LIMIT.NONAC;
}

// ── Count active bookings for a branch+date+time ─────────
function countActiveBookings(branch, date, time) {
  const now = new Date();
  return bookingsStore.filter((b) => {
    if (b.branch !== branch || b.date !== date || b.time !== time) return false;
    // Only count future bookings
    const dt = new Date(`${b.date} ${convertTo24(b.time)}`);
    return dt >= now;
  }).length;
}

// ── Get all booked slots for a branch+date ────────────────
exports.getBookedSlots = (req, res) => {
  const { branch, date } = req.query;
  if (!branch || !date) return res.json({ bookedSlots: [], slotCounts: {} });

  const now     = new Date();
  const limit   = getSlotLimit(branch);
  const counts  = {};

  bookingsStore.forEach((b) => {
    if (b.branch !== branch || b.date !== date) return;
    const dt = new Date(`${b.date} ${convertTo24(b.time)}`);
    if (dt < now) return; // past — skip
    counts[b.time] = (counts[b.time] || 0) + 1;
  });

  // Slots where count >= limit are "fully booked"
  const bookedSlots = Object.entries(counts)
    .filter(([, count]) => count >= limit)
    .map(([time]) => time);

  res.json({ bookedSlots, slotCounts: counts, slotLimit: limit });
};

// ── Convert "10:30 AM" → "10:30" ─────────────────────────
function convertTo24(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ── Build plain SMS text ──────────────────────────────────
function buildSMSText(booking) {
  const svcList = (booking.services || [])
    .map((s) => s.name + " Rs." + s.price)
    .join(", ");
  return (
    "New Booking - Lovely Mens Beauty Parlour. " +
    "Customer: " + booking.customerName + ". " +
    "Phone: " + booking.customerPhone + ". " +
    "Branch: " + booking.branch.split("—")[0].trim() + ". " +
    "Services: " + svcList + ". " +
    "Total: Rs." + booking.total + ". " +
    "Date: " + booking.date + " at " + booking.time
  );
}

// ── Build WhatsApp text ───────────────────────────────────
function buildWAText(booking) {
  const svcList = (booking.services || [])
    .map((s) => s.name + " (Rs." + s.price + ")")
    .join(", ");
  return (
    "New Booking - Lovely Mens Beauty Parlour\n\n" +
    "Customer: " + booking.customerName + "\n" +
    "Phone: " + booking.customerPhone + "\n" +
    "Branch: " + booking.branch + "\n" +
    "Services: " + svcList + "\n" +
    "Total: Rs." + booking.total + "\n" +
    "Date: " + booking.date + "\n" +
    "Time: " + booking.time + "\n\n" +
    "Booked via website"
  );
}

// ── Send SMS via Fast2SMS ─────────────────────────────────
function sendSMS(toPhone, message) {
  const apiKey = (process.env.FAST2SMS_API_KEY || "").trim();
  if (!apiKey || apiKey === "YOUR_FAST2SMS_KEY_HERE") {
    console.log("[SMS] No API key — skipping");
    return;
  }

  const cleanMsg = message.replace(/[^\x00-\x7F]/g, "").trim();
  const payload  = JSON.stringify({
    route: "q", sender_id: "FTSMS",
    message: cleanMsg, language: "english",
    flash: 0, numbers: toPhone,
  });

  const req = https.request({
    hostname: "www.fast2sms.com", path: "/dev/bulkV2", method: "POST",
    headers: {
      "authorization": apiKey,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Cache-Control": "no-cache",
    },
  }, (res) => {
    let body = "";
    res.on("data", (c) => body += c);
    res.on("end", () => {
      try {
        const p = JSON.parse(body);
        console.log(p.return ? "[SMS] Owner notified OK" : "[SMS] Error: " + body);
      } catch { console.log("[SMS]", body); }
    });
  });

  req.on("error", (e) => console.error("[SMS] Failed:", e.message));
  req.setTimeout(10000, () => { req.destroy(); });
  req.write(payload);
  req.end();
}

// ── GET /api/bookings ─────────────────────────────────────
exports.getBookings = (req, res) => {
  res.json(bookingsStore);
};

// ── GET /api/bookings/user/:phone ─────────────────────────
exports.getUserBookings = (req, res) => {
  const { phone } = req.params;
  const userBookings = bookingsStore.filter((b) => b.customerPhone === phone);
  res.json(userBookings);
};

// ── POST /api/bookings ────────────────────────────────────
exports.createBooking = (req, res) => {
  try {
    const { customerName, customerPhone, branch, date, time, services, total } = req.body;

    if (!customerName || !customerPhone || !branch || !date || !time) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const limit   = getSlotLimit(branch);
    const current = countActiveBookings(branch, date, time);

    if (current >= limit) {
      const slotsLeft = limit - current;
      return res.status(409).json({
        success:   false,
        slotFull:  true,
        error:     `This time slot is fully booked at ${branch.split("—")[0]}. Please choose a different time.`,
        slotsLeft: slotsLeft,
      });
    }

    const newBooking = {
      id:            Date.now().toString(),
      customerName,
      customerPhone,
      branch,
      date,
      time,
      services:  services || [],
      total:     total    || 0,
      status:    "confirmed",
      createdAt: new Date().toISOString(),
    };

    bookingsStore.push(newBooking);

    // Send SMS to owner — non-blocking
    sendSMS(OWNER_PHONE, buildSMSText(newBooking));

    const waText = buildWAText(newBooking);

    res.status(201).json({
      success:         true,
      booking:         newBooking,
      whatsappMessage: waText,
      whatsappLink:    "https://wa.me/91" + OWNER_PHONE + "?text=" + encodeURIComponent(waText),
    });

  } catch (err) {
    console.error("[Booking Error]", err.message);
    res.status(500).json({ error: "Failed to save booking." });
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────
exports.deleteBooking = (req, res) => {
  try {
    const before  = bookingsStore.length;
    bookingsStore = bookingsStore.filter((b) => b.id !== req.params.id);
    if (bookingsStore.length === before)
      return res.status(404).json({ error: "Booking not found" });
    res.json({ success: true, message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};
