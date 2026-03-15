// ============================================================
// Bookings Controller
// Features:
//  - Auto-delete expired bookings (past date+time)
//  - Slot limits: AC=1, NonAC=2
//  - SMS to owner via Fast2SMS
// ============================================================
const https = require("https");

let bookingsStore = [];
const OWNER_PHONE = "9442887267";

// ── Convert "10:30 AM" → "10:30" ─────────────────────────
function to24(t) {
  if (!t) return "00:00";
  const [time, p] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

// ── Auto-delete bookings whose date+time has passed ───────
function cleanExpiredBookings() {
  const now = new Date();
  const before = bookingsStore.length;
  bookingsStore = bookingsStore.filter(b => {
    const dt = new Date(`${b.date} ${to24(b.time)}`);
    return dt >= now; // keep only future bookings
  });
  const removed = before - bookingsStore.length;
  if (removed > 0) console.log(`[Auto-Clean] Removed ${removed} expired booking(s)`);
}

// Run auto-clean every 5 minutes
setInterval(cleanExpiredBookings, 5 * 60 * 1000);

// ── Slot limit per branch ─────────────────────────────────
function slotLimit(branch) {
  return (branch || "").toLowerCase().includes("ac branch") ? 1 : 2;
}

// ── Count active bookings for a slot ─────────────────────
function countSlot(branch, date, time) {
  const now = new Date();
  return bookingsStore.filter(b => {
    const dt = new Date(`${b.date} ${to24(b.time)}`);
    return b.branch === branch && b.date === date && b.time === time && dt >= now;
  }).length;
}

// ── Build SMS text (plain ASCII only) ────────────────────
function buildSMS(b) {
  const svcs = (b.services||[]).map(s => `${s.name} (Rs.${s.price})`).join(", ");
  return `New Booking - Lovely Mens Beauty Parlour\n`+
    `Customer: ${b.customerName}\n`+
    `Phone: ${b.customerPhone}\n`+
    `Branch: ${b.branch}\n`+
    `Services: ${svcs}\n`+
    `Total: Rs.${b.total}\n`+
    `Date: ${b.date}\n`+
    `Time: ${b.time}\n`+
    `Booked via website`;
}

// ── Build WhatsApp text ───────────────────────────────────
function buildWA(b) {
  const svcs = (b.services||[]).map(s => `${s.name} (Rs.${s.price})`).join(", ");
  return `New Booking - Lovely Mens Beauty Parlour\n\n`+
    `Customer: ${b.customerName}\n`+
    `Phone: ${b.customerPhone}\n`+
    `Branch: ${b.branch}\n`+
    `Services: ${svcs}\n`+
    `Total: Rs.${b.total}\n`+
    `Date: ${b.date}\n`+
    `Time: ${b.time}\n\n`+
    `Sent via Lovely Mens Beauty Parlour Website`;
}

// ── Send SMS via Fast2SMS ─────────────────────────────────
function sendSMS(text) {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key || key === "YOUR_FAST2SMS_KEY_HERE" || key.trim() === "") {
    console.log("[SMS] No API key — skipping"); return;
  }
  const clean   = text.replace(/[^\x00-\x7F]/g,"");
  const payload = JSON.stringify({ route:"q", sender_id:"FTSMS", message:clean, language:"english", flash:0, numbers:OWNER_PHONE });
  const req = https.request({
    hostname:"www.fast2sms.com", path:"/dev/bulkV2", method:"POST",
    headers:{ "authorization":key.trim(), "Content-Type":"application/json", "Content-Length":Buffer.byteLength(payload), "Cache-Control":"no-cache" }
  }, res => {
    let body="";
    res.on("data",c=>body+=c);
    res.on("end",()=>{ try{ const p=JSON.parse(body); console.log(p.return?"[SMS] Sent OK":"[SMS] Error:"+body); }catch{console.log("[SMS]",body);} });
  });
  req.on("error",e=>console.error("[SMS] Failed:",e.message));
  req.setTimeout(8000,()=>{ req.destroy(); });
  req.write(payload); req.end();
}

// ── GET /api/bookings/slots?branch=X&date=Y ──────────────
exports.getBookedSlots = (req, res) => {
  cleanExpiredBookings();
  const { branch, date } = req.query;
  if (!branch || !date) return res.json({ bookedSlots:[], slotCounts:{}, slotLimit:1 });
  const now = new Date();
  const counts = {};
  bookingsStore.forEach(b => {
    const dt = new Date(`${b.date} ${to24(b.time)}`);
    if (b.branch===branch && b.date===date && dt>=now)
      counts[b.time] = (counts[b.time]||0)+1;
  });
  const limit = slotLimit(branch);
  const bookedSlots = Object.keys(counts).filter(t => counts[t]>=limit);
  res.json({ bookedSlots, slotCounts:counts, slotLimit:limit });
};

// ── GET /api/bookings ─────────────────────────────────────
exports.getBookings = (req, res) => {
  cleanExpiredBookings();
  res.json(bookingsStore);
};

// ── GET /api/bookings/user/:phone ─────────────────────────
// Returns only UPCOMING (future) bookings for this user
exports.getUserBookings = (req, res) => {
  cleanExpiredBookings();
  const { phone } = req.params;
  const now = new Date();
  const userBookings = bookingsStore.filter(b => {
    const dt = new Date(`${b.date} ${to24(b.time)}`);
    return b.customerPhone === phone && dt >= now; // only future bookings
  });
  res.json(userBookings);
};

// ── POST /api/bookings ────────────────────────────────────
exports.createBooking = (req, res) => {
  try {
    cleanExpiredBookings();
    const { customerName, customerPhone, branch, date, time, services, total } = req.body;

    // Check slot limit
    const current = countSlot(branch, date, time);
    const limit   = slotLimit(branch);
    if (current >= limit) {
      return res.status(409).json({
        success:false, slotTaken:true,
        error:`${time} on ${date} is fully booked at ${(branch||"").split("—")[0].trim()}. Please choose another slot.`
      });
    }

    const newBooking = {
      id: Date.now().toString(),
      customerName:  customerName||"",
      customerPhone: customerPhone||"",
      branch:        branch||"",
      date:          date||"",
      time:          time||"",
      services:      services||[],
      total:         total||0,
      createdAt:     new Date().toISOString(),
    };

    bookingsStore.push(newBooking);

    const smsText = buildSMS(newBooking);
    const waText  = buildWA(newBooking);

    sendSMS(smsText);

    res.status(201).json({
      success:true, booking:newBooking,
      whatsappMessage:waText,
      whatsappLink:`https://wa.me/91${OWNER_PHONE}?text=${encodeURIComponent(waText)}`,
    });
  } catch(err) {
    console.error("[Booking Error]", err.message);
    res.status(500).json({ error:"Failed to save booking: "+err.message });
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────
exports.deleteBooking = (req, res) => {
  try {
    const before = bookingsStore.length;
    bookingsStore = bookingsStore.filter(b => b.id !== req.params.id);
    if (bookingsStore.length === before)
      return res.status(404).json({ error:"Booking not found" });
    res.json({ success:true });
  } catch(err) {
    res.status(500).json({ error:"Failed to delete" });
  }
};
