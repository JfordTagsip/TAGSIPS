const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { getDB } = require("./db");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
getDB().then(() => {
  console.log('✅ Database initialized successfully');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Routes
app.use("/api", routes);

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Backend Connected Successfully ✅" });
});

// Server Listen
// 💡 Gamiton ang variable nga PORT imbes nga process.env.PORT sa function call
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});