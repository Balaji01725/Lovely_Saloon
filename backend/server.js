// =============================================
// Lovely Mens Beauty Parlour - Backend Server
// =============================================
require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const bookingsRouter = require("./routes/bookings");
const servicesRouter = require("./routes/services");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS — Allow ALL origins (fixes Vercel cross-origin errors) ──
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Routes
app.use("/api/bookings", bookingsRouter);
app.use("/api/services", servicesRouter);

app.get("/", (req, res) => {
  res.json({ message: "Lovely Mens Beauty Parlour API is running!" });
});

// Only listen locally (Vercel uses module.exports)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
