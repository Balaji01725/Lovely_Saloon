const express = require("express");
const router  = express.Router();
const {
  getBookings,
  getUserBookings,
  createBooking,
  deleteBooking,
  getBookedSlots,
} = require("../controllers/bookingsController");

router.get("/slots",        getBookedSlots);    // GET /api/bookings/slots?branch=X&date=Y
router.get("/user/:phone",  getUserBookings);   // GET /api/bookings/user/9999999999
router.get("/",             getBookings);       // GET /api/bookings  (admin)
router.post("/",            createBooking);     // POST /api/bookings
router.delete("/:id",       deleteBooking);     // DELETE /api/bookings/:id

module.exports = router;
