const multer = require("multer");
const path = require("path");

// STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueFileName = `${Date.now()}-${file.originalname}`;

    cb(null, uniqueFileName);
  },
});

// FILE FILTER
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// MULTER CONFIG
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Maximum 2 MB
    files: 1, // Only one resume
  },
});

module.exports = upload;