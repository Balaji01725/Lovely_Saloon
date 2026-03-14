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

// Allow requests from any frontend origin (needed for Vercel)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
app.use("/api/bookings", bookingsRouter);
app.use("/api/services", servicesRouter);

app.get("/", (req, res) => {
  res.json({ message: "Lovely Mens Beauty Parlour API is running!" });
});

// Only listen when running locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
