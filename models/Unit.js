const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Unit name is required"],
      trim: true,
      unique: true,
    },
    abbreviation: {
      type: String,
      required: [true, "Unit abbreviation is required"],
      trim: true,
      unique: true,
    },
    unitType: {
      type: String,
      enum: ["base", "derived", ""],
      default: "",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Unit", unitSchema);