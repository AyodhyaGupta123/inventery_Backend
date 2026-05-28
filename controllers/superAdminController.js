const Company = require("../models/Company");
const User = require("../models/User");

const createCompany = async (req, res) => {
  try {
    const {
      companyName,
      companyType,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      gstNumber,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.status(400).json({
        success: false,
        message: "Company already exists",
      });
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: "Admin email already exists",
      });
    }

    const company = await Company.create({
      companyName,
      companyType,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      gstNumber,
      createdBy: req.user?._id || null,
    });

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      companyId: company._id,
      company: company.companyName,
      companyType,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Company and admin created successfully",
      company,
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
};