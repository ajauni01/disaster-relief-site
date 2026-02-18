/**
 * Ethan McEvoy
 * Spring 2026
 * 
 */

import helpRoutes from "./routes/helpRequests.js";
import volunteerRoutes from "./routes/volunteers.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://leratolamla_db_user:tPBVe3Nr2KmRlwQP@cluster0.knjejmg.mongodb.net/?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use("/api/help-requests", helpRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});

// Example API route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
