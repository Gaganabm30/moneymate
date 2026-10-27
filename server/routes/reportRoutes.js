const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getReportData,
  exportCSV,
  exportExcel,
  exportPDF,
} = require("../controllers/reportController");

// All report routes require authenticated user
router.use(protect);

router.get("/data", getReportData);
router.get("/export/csv", exportCSV);
router.get("/export/excel", exportExcel);
router.get("/export/pdf", exportPDF);

module.exports = router;
