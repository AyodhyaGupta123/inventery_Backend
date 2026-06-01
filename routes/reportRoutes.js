const express = require("express");
const router = express.Router();

const {
  getReports,
  createReport,
  getReportById,
  updateReport,
  deleteReport,
} = require("../controllers/reportController");

router.get("/", getReports);
router.post("/", createReport);
router.get("/:id", getReportById);
router.put("/:id", updateReport);
router.delete("/:id", deleteReport);

module.exports = router;