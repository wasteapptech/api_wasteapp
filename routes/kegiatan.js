const express = require("express");
const { tambahKegiatan, getKegiatan } = require("../controllers/kegiatanController");

const router = express.Router();

router.post("/", tambahKegiatan);
router.get("/", getKegiatan);

module.exports = router;
