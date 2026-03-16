// =============================================
// Lovely Mens Beauty Parlour - Backend Server
// =============================================
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

const bookingsRouter = require("./routes/bookings");
const servicesRouter = require("./routes/services");
const authRouter     = require("./routes/auth");

const app  = express();
const PORT = process.env.PORT || 5000;

// CORS — allow all origins
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",  "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(express.json());

// ── Connect to MongoDB ────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && MONGODB_URI !== "YOUR_MONGODB_URI_HERE") {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err.message));
} else {
  console.log("⚠️  No MongoDB URI — using in-memory storage (add MONGODB_URI to .env)");
}

// Routes
app.use("/api/auth",     authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/services", servicesRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Lovely Mens Beauty Parlour API running!",
    db: mongoose.connection.readyState === 1 ? "MongoDB connected" : "In-memory mode"
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
