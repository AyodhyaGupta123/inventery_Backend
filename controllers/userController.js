const User = require("../models/User");

const createStaffUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!["manager", "staff"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Only manager or staff can be created",
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      companyId: req.user.companyId,
      company: req.user.company,
      companyType: req.user.companyType,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCompanyUsers = async (req, res) => {
  try {
    const users = await User.find({
      companyId: req.user.companyId,
      role: { $in: ["manager", "staff"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCompanyUser = async (req, res) => {
  try {
    const { name, phone, role, isActive } = req.body;

    if (role && !["manager", "staff"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.role = role || user.role;

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompanyUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStaffUser,
  getCompanyUsers,
  getUserById,
  updateCompanyUser,
  deleteCompanyUser,
};