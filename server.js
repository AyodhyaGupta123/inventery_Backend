const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();

connectDB();

const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      email: "admin@inventory.com",
    });

    if (!adminExists) {
      await User.create({
        name: "Super Admin",
        email: "admin@inventory.com",
        password: "Admin@123",
        role: "admin",
      });

      console.log("Default Admin Created");
    } else {
      console.log("Admin already exists");
    }
  } catch (error) {
    console.log(error.message);
  }
};

createDefaultAdmin();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});