// backend/models/Booking.js
// MongoDB schema for bookings — persists permanently across Vercel restarts

const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  customerName:  { type: String, required: true },
  customerPhone: { type: String, required: true },
  branch:        { type: String, required: true },
  date:          { type: String, required: true },
  time:          { type: String, required: true },
  services:      { type: Array,  default: [] },
  total:         { type: Number, default: 0 },
  createdAt:     { type: Date,   default: Date.now },
});

// Auto-delete expired bookings (TTL index — MongoDB handles this automatically)
// Bookings are deleted after their appointment date+time has passed

module.exports = mongoose.model("Booking", BookingSchema);
