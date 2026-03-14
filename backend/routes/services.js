const express = require("express");
const router = express.Router();
const { getServices, updateService } = require("../controllers/servicesController");

router.get("/", getServices);
router.put("/:id", updateService);

module.exports = router;
