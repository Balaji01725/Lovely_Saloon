// ============================================================
// Bookings Controller
// Uses MongoDB if connected, falls back to memory if not
// ============================================================
const https    = require("https");
const mongoose = require("mongoose");

// Try to load Booking model (only works when mongoose is connected)
let Booking;
try { Booking = require("../models/Booking"); } catch(e) { Booking = null; }

// In-memory fallback
let memStore = [];
const OWNER  = "9442887267";

// ── Is MongoDB available? ────────────────────────────────
function useDB() {
  return mongoose.connection.readyState === 1 && Booking;
}

// ── Time helpers ─────────────────────────────────────────
function to24(t) {
  if (!t) return "00:00";
  const [time, p] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (p==="PM" && h!==12) h+=12;
  if (p==="AM" && h===12) h=0;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function bookingDateTime(b) {
  return new Date(`${b.date} ${to24(b.time)}`);
}

// ── Clean expired memory bookings ────────────────────────
function cleanMem() {
  const now = new Date();
  const before = memStore.length;
  memStore = memStore.filter(b => bookingDateTime(b) >= now);
  if (memStore.length < before)
    console.log(`[Clean] Removed ${before - memStore.length} expired`);
}
setInterval(cleanMem, 5 * 60 * 1000);

// ── Slot limit per branch ─────────────────────────────────
function slotLimit(branch) {
  return (branch||"").toLowerCase().includes("ac branch") ? 1 : 2;
}

// ── Count active bookings for a slot ─────────────────────
async function countSlot(branch, date, time) {
  const now = new Date();
  if (useDB()) {
    // Get all bookings for this branch+date+time from DB
    const all = await Booking.find({ branch, date, time });
    return all.filter(b => bookingDateTime(b) >= now).length;
  }
  return memStore.filter(b => {
    return b.branch===branch && b.date===date && b.time===time && bookingDateTime(b)>=now;
  }).length;
}

// ── Build SMS text (plain ASCII — no emojis) ─────────────
function buildSMS(b) {
  const svcs = (b.services||[]).map(s=>`${s.name} (Rs.${s.price})`).join(", ");
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
  const svcs = (b.services||[]).map(s=>`${s.name} (Rs.${s.price})`).join(", ");
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
  if (!key || key==="YOUR_FAST2SMS_KEY_HERE" || !key.trim()) {
    console.log("[SMS] No API key — skipped"); return;
  }
  const msg     = text.replace(/[^\x00-\x7F]/g,"");
  const payload = JSON.stringify({ route:"q", sender_id:"FTSMS", message:msg, language:"english", flash:0, numbers:OWNER });
  const req = https.request({
    hostname:"www.fast2sms.com", path:"/dev/bulkV2", method:"POST",
    headers:{ "authorization":key.trim(), "Content-Type":"application/json", "Content-Length":Buffer.byteLength(payload), "Cache-Control":"no-cache" }
  }, res=>{
    let body="";
    res.on("data",c=>body+=c);
    res.on("end",()=>{
      try{ const p=JSON.parse(body); console.log(p.return?"[SMS] Sent OK":"[SMS] Error:"+body); }
      catch{ console.log("[SMS]",body); }
    });
  });
  req.on("error",e=>console.error("[SMS]",e.message));
  req.setTimeout(8000,()=>req.destroy());
  req.write(payload); req.end();
}

// ══════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════

// GET /api/bookings/slots?branch=X&date=Y
exports.getBookedSlots = async (req, res) => {
  try {
    const { branch, date } = req.query;
    if (!branch || !date) return res.json({ bookedSlots:[], slotLimit:1 });

    const now = new Date();
    let counts = {};

    if (useDB()) {
      const docs = await Booking.find({ branch, date });
      docs.filter(b=>bookingDateTime(b)>=now).forEach(b=>{
        counts[b.time] = (counts[b.time]||0)+1;
      });
    } else {
      cleanMem();
      memStore.filter(b=>b.branch===branch&&b.date===date&&bookingDateTime(b)>=now)
        .forEach(b=>{ counts[b.time]=(counts[b.time]||0)+1; });
    }

    const limit       = slotLimit(branch);
    const bookedSlots = Object.keys(counts).filter(t=>counts[t]>=limit);
    res.json({ bookedSlots, slotCounts:counts, slotLimit:limit });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/bookings  (admin — all bookings)
exports.getBookings = async (req, res) => {
  try {
    if (useDB()) {
      const docs = await Booking.find().sort({ createdAt:-1 });
      return res.json(docs);
    }
    cleanMem();
    res.json([...memStore].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/bookings/user/:phone  (customer — their upcoming bookings)
exports.getUserBookings = async (req, res) => {
  try {
    const { phone } = req.params;
    const now = new Date();

    if (useDB()) {
      // Get ALL bookings for this phone from DB
      const docs = await Booking.find({ customerPhone: phone }).sort({ date:1 });
      // Filter to only future ones
      const future = docs.filter(b => bookingDateTime(b) >= now);
      return res.json(future);
    }

    cleanMem();
    const future = memStore
      .filter(b => b.customerPhone===phone && bookingDateTime(b)>=now)
      .sort((a,b) => bookingDateTime(a)-bookingDateTime(b));
    res.json(future);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/bookings  (create booking)
exports.createBooking = async (req, res) => {
  try {
    const { customerName, customerPhone, branch, date, time, services, total } = req.body;

    // Check slot limit
    const current = await countSlot(branch, date, time);
    const limit   = slotLimit(branch);
    if (current >= limit) {
      return res.status(409).json({
        success:false, slotTaken:true,
        error:`${time} on ${date} is fully booked at ${(branch||"").split("—")[0].trim()}. Please choose another slot.`
      });
    }

    let saved;

    if (useDB()) {
      const doc = new Booking({ customerName, customerPhone, branch, date, time, services:services||[], total:total||0 });
      saved = await doc.save();
      saved = saved.toObject();
      saved.id = saved._id.toString();
    } else {
      saved = {
        id: Date.now().toString(),
        customerName, customerPhone, branch, date, time,
        services: services||[], total: total||0,
        createdAt: new Date().toISOString(),
      };
      memStore.push(saved);
    }

    const smsText = buildSMS(saved);
    const waText  = buildWA(saved);

    sendSMS(smsText); // non-blocking

    res.status(201).json({
      success: true,
      booking: saved,
      whatsappMessage: waText,
      whatsappLink: `https://wa.me/91${OWNER}?text=${encodeURIComponent(waText)}`,
    });

  } catch(err) {
    console.error("[Booking Error]", err.message);
    res.status(500).json({ error: "Failed to save booking: "+err.message });
  }
};

// DELETE /api/bookings/:id  (admin or customer cancel)
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (useDB()) {
      const doc = await Booking.findByIdAndDelete(id);
      if (!doc) return res.status(404).json({ error:"Booking not found" });
      return res.json({ success:true });
    }

    const before = memStore.length;
    memStore = memStore.filter(b => b.id !== id);
    if (memStore.length === before) return res.status(404).json({ error:"Booking not found" });
    res.json({ success:true });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
