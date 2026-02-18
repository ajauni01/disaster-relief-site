import express from "express";

const router = express.Router();

let volunteers = [];

// POST /api/volunteers
router.post("/", (req, res) => {
  const newVolunteer = {
    id: Date.now().toString(),
    name: req.body.name,
    skills: req.body.skills,
    location: req.body.location,
  };

  volunteers.push(newVolunteer);
  res.status(201).json(newVolunteer);
});

// GET /api/volunteers
router.get("/", (req, res) => {
  res.json(volunteers);
});

// GET /api/volunteers/:id
router.get("/:id", (req, res) => {
  const volunteer = volunteers.find(v => v.id === req.params.id);

  if (!volunteer) {
    return res.status(404).json({ message: "Volunteer not found" });
  }

  res.json(volunteer);
});

export default router;
