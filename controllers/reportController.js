const Report = require("../models/Report");

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { name, type, schedule, lastRun, status, rows } = req.body;

    if (!name || !type || !schedule) {
      return res.status(400).json({
        success: false,
        message: "Name, type and schedule are required",
      });
    }

    const report = await Report.create({
      name,
      type,
      schedule,
      lastRun: lastRun || null,
      status: status || "Scheduled",
      rows: rows || 0,
    });

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create report",
      error: error.message,
    });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update report",
      error: error.message,
    });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};