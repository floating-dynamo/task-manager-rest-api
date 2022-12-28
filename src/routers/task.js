const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

// Fetching all the tasks from the DB
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const options = {};
  const sort = {};

  // Filtering -> GET /tasks?completed=true || /tasks?completed=false
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  // Pagination -> GET /tasks?limit=10&page=1 -> First 10 results,
  // GET /tasks?limit=10&page=2 -> Second set of 10 results
  if (req.query.limit) {
    options.limit = parseInt(req.query.limit);
  }
  if (req.query.page) {
    options.skip = (parseInt(req.query.page) - 1) * parseInt(req.query.limit);
  }

  // GET /tasks?sortBy=createdAt:asc || createdAt:desc
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    options.sort = sort;
  }

  try {
    await req.user.populate({
      path: "tasks",
      match,
      options,
    });
    res.status(200).json(req.user.tasks);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Fetching individual task by Id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id }); // Fetching the task with the id and which belongs to the authenticated user
    if (!task) {
      return res.status(404).json({
        message: "The task with the given ID does not exist!",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Adding a new Task to the DB
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id }); // relating the owner that was authenticated with the particular task

  try {
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json(err);
  }
});

// Updating a task
router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({
      message: "Invalid Update Parameters!",
    });
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).json({
        message: "Task with the given id does not exist!",
      });
    }

    // Runs for each key that is to be updated
    updates.forEach((update) => {
      task[update] = req.body[update]; // Setting the key to its corresponding value
    });

    await task.save();

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Deleting a task
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).json({
        message: "The task with the given ID does not exist!",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
