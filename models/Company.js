const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    companyType: {
      type: String,
      enum: [
        "Retail",
        "Manufacturing",
        "Warehouse",
        "Distributor",
        "Pharmacy",
        "Grocery",
        "General",
      ],
      default: "General",
    },

    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Company email is required"],
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    gstNumber: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);