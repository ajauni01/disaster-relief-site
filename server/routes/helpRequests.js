import express from "express";

const router = express.Router();

// Temporary in-memory storage
let helpRequests = [];

// Create help request
router.post("/", (req, res) => {
  const newRequest = {
    id: Date.now(),
    name: req.body.name,
    location: req.body.location,
    description: req.body.description,
  };

  helpRequests.push(newRequest);
  res.status(201).json(newRequest);
});

// Get all help requests
router.get("/", (req, res) => {
  res.json(helpRequests);
});

export default router;
