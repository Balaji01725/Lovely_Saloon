// ============================
// Services Controller
// ============================
const fs = require("fs");
const path = require("path");

const servicesPath = path.join(__dirname, "../data/services.json");

// Helper: read services from file
function readServices() {
  const data = fs.readFileSync(servicesPath, "utf-8");
  return JSON.parse(data);
}

// Helper: write services to file
function writeServices(services) {
  fs.writeFileSync(servicesPath, JSON.stringify(services, null, 2));
}

// GET /api/services — return all services
exports.getServices = (req, res) => {
  try {
    const services = readServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to read services" });
  }
};

// PUT /api/services/:id — update a service (admin only)
exports.updateService = (req, res) => {
  try {
    const services = readServices();
    const id = parseInt(req.params.id);
    const index = services.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Merge existing service with updated fields
    services[index] = { ...services[index], ...req.body };
    writeServices(services);

    res.json({ message: "Service updated successfully", service: services[index] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update service" });
  }
};
