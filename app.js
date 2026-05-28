const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const returnRoutes = require("./routes/returnRoutes");
const refundRoutes = require("./routes/refundRoutes");
const brandRoutes = require("./routes/brandRoutes");
const stockRoutes = require("./routes/stockRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const transferRoutes = require("./routes/transferRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const userRoutes = require("./routes/userRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
const grnRoutes = require("./routes/grnRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();


app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Generic Inventory API running successfully"
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/purchases/suppliers", supplierRoutes);
app.use("/api/purchases/orders", purchaseOrderRoutes);
app.use("/api/purchases/grn", grnRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;