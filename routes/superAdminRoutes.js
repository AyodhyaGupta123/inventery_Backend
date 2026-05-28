const express = require("express");
const {
  createCompany,
  getCompanies,
} = require("../controllers/superAdminController");

const { protect, superAdminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-company", protect, superAdminOnly, createCompany);
router.get("/companies", protect, superAdminOnly, getCompanies);

module.exports = router;