const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: "../.env" });

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ role: "super_admin" });

    if (exists) {
      console.log("Super admin already exists");
      process.exit();
    }

    await User.create({
      name: "Super Admin",
      email: "superadmin@gmail.com",
      password: "123456",
      role: "super_admin",
      company: "Generic Inventory",
      companyId: null,
      companyType: "General",
    });

    console.log("Super admin created successfully");
    process.exit();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

createSuperAdmin();