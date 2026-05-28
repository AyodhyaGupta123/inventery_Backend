const express = require("express");

const {
  createGRN,
  getGRNs,
} = require("../controllers/grnController");

const router = express.Router();

router.post("/", createGRN);

router.get("/", getGRNs);

module.exports = router;