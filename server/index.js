const express = require("express");
const path = require("path");

const convertRoute = require("./routes/convert");

const app = express();

// 🔑 IMPORTANT: use environment port if available
const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// API
app.use("/convert", convertRoute);

// Error handler
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
