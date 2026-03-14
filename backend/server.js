require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRouter     = require("./routes/auth");
const bookingsRouter = require("./routes/bookings");
const servicesRouter = require("./routes/services");

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

app.use("/api/auth",     authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/services", servicesRouter);

app.get("/", (req, res) => {
  res.json({ message: "Lovely Mens Beauty Parlour API running!" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = app;
