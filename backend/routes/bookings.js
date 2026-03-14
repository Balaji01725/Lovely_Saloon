const express = require("express");
const router  = express.Router();
const {
  getBookings,
  createBooking,
  deleteBooking,
  getBookedSlots,
} = require("../controllers/bookingsController");

router.get("/",           getBookings);
router.get("/slots",      getBookedSlots);   // GET /api/bookings/slots?branch=X&date=Y
router.post("/",          createBooking);
router.delete("/:id",     deleteBooking);

module.exports = router;
