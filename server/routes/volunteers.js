import express from "express";

const router = express.Router();

let volunteers = [];

router.post("/", (req, res) => {
  const newVolunteer = {
    id: Date.now(),
    name: req.body.name,
    skills: req.body.skills,
    location: req.body.location,
  };

  volunteers.push(newVolunteer);
  res.status(201).json(newVolunteer);
});

router.get("/", (req, res) => {
  res.json(volunteers);
});

export default router;
