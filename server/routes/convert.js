const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { generateAscii } = require("../services/asciiGenerator");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "uploads")
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ ascii: "ERROR: No image received" });
    }

    // 🔑 SAFE OPTION PARSING
    const options = {
      width:
        req.body.width !== undefined
          ? parseInt(req.body.width, 10)
          : undefined,

      height:
        req.body.height !== undefined
          ? parseInt(req.body.height, 10)
          : undefined,

      braille: req.body.braille === "true",
      color: req.body.color === "true",

      threshold:
        req.body.threshold !== undefined
          ? parseInt(req.body.threshold, 10)
          : undefined
    };

    console.log("OPTIONS:", options); // 👈 DEBUG (keep for now)

    const result = await generateAscii(req.file.path, options);

    fs.unlink(req.file.path, () => {});

    res.json({
      ascii: result.ascii,
      palette: result.palette
    });
  } catch (err) {
    console.error("CONVERT ERROR:", err);
    res.json({
      ascii: "GENERATOR ERROR:\n" + err.message
    });
  }
});

module.exports = router;
