const asyncHandler = require("express-async-handler");
const Warehouse = require("../models/Warehouse");

const createWarehouse = asyncHandler(async (req, res) => {
  const { name, code, managerName, phone, address, city, status } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error("Warehouse name and code are required");
  }

  const exists = await Warehouse.findOne({ code: code.toUpperCase() });

  if (exists) {
    res.status(400);
    throw new Error("Warehouse code already exists");
  }

  const warehouse = await Warehouse.create({
    name,
    code: code.toUpperCase(),
    managerName,
    phone,
    address,
    city,
    status,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Warehouse created successfully",
    warehouse,
  });
});

const getWarehouses = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const query = {};

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  const warehouses = await Warehouse.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: warehouses.length,
    warehouses,
  });
});

const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (!warehouse) {
    res.status(404);
    throw new Error("Warehouse not found");
  }

  res.status(200).json({
    success: true,
    warehouse,
  });
});

const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (!warehouse) {
    res.status(404);
    throw new Error("Warehouse not found");
  }

  warehouse.name = req.body.name || warehouse.name;
  warehouse.code = req.body.code ? req.body.code.toUpperCase() : warehouse.code;
  warehouse.managerName = req.body.managerName || warehouse.managerName;
  warehouse.phone = req.body.phone || warehouse.phone;
  warehouse.address = req.body.address || warehouse.address;
  warehouse.city = req.body.city || warehouse.city;
  warehouse.status = req.body.status || warehouse.status;

  const updatedWarehouse = await warehouse.save();

  res.status(200).json({
    success: true,
    message: "Warehouse updated successfully",
    warehouse: updatedWarehouse,
  });
});

const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (!warehouse) {
    res.status(404);
    throw new Error("Warehouse not found");
  }

  await warehouse.deleteOne();

  res.status(200).json({
    success: true,
    message: "Warehouse deleted successfully",
  });
});

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};