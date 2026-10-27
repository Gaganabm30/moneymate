const reportService = require("../services/reportService");

/**
 * @route   GET /api/reports/data
 * @desc    Get structured financial report data for on-screen preview & charts
 * @access  Private
 */
const getReportData = async (req, res) => {
  try {
    const { reportType, preset, startDate, endDate, typeFilter, category } = req.query;

    const report = await reportService.getReportData(req.user._id, {
      reportType,
      preset,
      startDate,
      endDate,
      typeFilter,
      category,
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Report Data Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate report data",
    });
  }
};

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export filtered records as a valid UTF-8 CSV
 * @access  Private
 */
const exportCSV = async (req, res) => {
  try {
    const { reportType, preset, startDate, endDate, typeFilter, category } = req.query;

    const csvContent = await reportService.generateCSV(req.user._id, {
      reportType,
      preset,
      startDate,
      endDate,
      typeFilter,
      category,
    });

    const filename = `MoneyMate_${reportType || "statement"}_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("CSV Export Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate CSV export",
    });
  }
};

/**
 * @route   GET /api/reports/export/excel
 * @desc    Export filtered records as genuine Excel XLSX with summary sheet & formatting
 * @access  Private
 */
const exportExcel = async (req, res) => {
  try {
    const { reportType, preset, startDate, endDate, typeFilter, category } = req.query;

    const buffer = await reportService.generateExcel(req.user._id, {
      reportType,
      preset,
      startDate,
      endDate,
      typeFilter,
      category,
    });

    const filename = `MoneyMate_${reportType || "statement"}_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate Excel export",
    });
  }
};

/**
 * @route   GET /api/reports/export/pdf
 * @desc    Export filtered report as a formatted PDF with MoneyMate branding and tables
 * @access  Private
 */
const exportPDF = async (req, res) => {
  try {
    const { reportType, preset, startDate, endDate, typeFilter, category } = req.query;

    const buffer = await reportService.generatePDF(req.user._id, {
      reportType,
      preset,
      startDate,
      endDate,
      typeFilter,
      category,
    });

    const filename = `MoneyMate_${reportType || "statement"}_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate PDF report",
    });
  }
};

module.exports = {
  getReportData,
  exportCSV,
  exportExcel,
  exportPDF,
};
