import express from "express";

const router = express.Router();

let helpRequests = [];

// POST /api/help-requests
router.post("/", (req, res) => {
  const newRequest = {
    id: Date.now().toString(),
    name: req.body.name,
    location: req.body.location,
    description: req.body.description,
  };

  helpRequests.push(newRequest);
  res.status(201).json(newRequest);
});

// GET /api/help-requests
router.get("/", (req, res) => {
  res.json(helpRequests);
});

// GET /api/help-requests/:id
router.get("/:id", (req, res) => {
  const request = helpRequests.find(r => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ message: "Help request not found" });
  }

  res.json(request);
});

export default router;
