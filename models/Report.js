const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Revenue", "Performance", "Analytics", "Ads"],
      required: true,
    },
    schedule: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      required: true,
    },
    lastRun: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Completed", "Running", "Scheduled"],
      default: "Scheduled",
    },
    rows: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);