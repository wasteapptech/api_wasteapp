const express = require("express");
const { tambahKegiatan, getKegiatan, updateKegiatan, hapusKegiatan } = require("../controllers/kegiatanController");

const router = express.Router();

router.post("/", tambahKegiatan); 
router.get("/", getKegiatan); 
router.put("/:id", updateKegiatan); 
router.delete("/:id", hapusKegiatan); 

module.exports = router;
