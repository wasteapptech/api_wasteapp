
const express = require("express");
const { login, createAdmin } = require("../controllers/adminController");

const router = express.Router();

router.post("/login", login);
router.post("/createadmin", createAdmin);
module.exports = router;
