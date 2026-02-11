/**
 * Ethan McEvoy
 * Spring 2026
 * This is the server side of the disaster relief website made for Senior Semenar. It relies on helpRequest and
 * vonteers.js to send data to the database from the front end.
 */

POST   /api/help-requests
GET    /api/help-requests
//GET    /api/help-requests/:id

POST   /api/volunteers
GET    /api/volunteers
//GET    /api/volunteers/:id

import express from "express";
import dotenv from "dotenv";
import helpRoutes from "./routes/helpRequests.js";
import volunteerRoutes from "./routes/volunteers.js";

app.use("/api/help", helpRoutes);
app.use("/api/volunteers", volunteerRoutes);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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

