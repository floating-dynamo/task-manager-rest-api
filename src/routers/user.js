const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");

// Setting up multer for avatar upload
const upload = multer({
  limits: {
    fileSize: 1000000, // in bytes -> 1Mb
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg|JPG)$/)) {
      return cb(new Error("Please upload a png or jpg!"));
    }

    cb(undefined, true);
  },
});

// Accepting the user Avatar upload
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    // Setting the avatar for the authenticated user
    req.user.avatar = buffer;
    await req.user.save();

    res.json({
      message: "Avatar uploaded successfully!",
    });
  },
  (err, req, res, next) => {
    // This function runs after the function above does
    res.status(400).json({
      error: err.message,
    });
  }
);

// Deleting the User Avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;

  await req.user.save();

  res.status(200).json({
    message: "Your avatar was deleted successfully",
  });
});

// Fetching the User avatar
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      return res.status(404).json({
        message: "Avatar does not exist!",
      });
    }

    // Setting the response header
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(500).json({
      message: "An error occured!",
    });
  }
});

// Getting the user profile who is authenticated
router.get("/users/me", auth, async (req, res) => {
  res.status(200).json(req.user);
});

// Adding a new User to the DB (Sign Up)
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save(); // If this doesn't work catch will run
    // Sending the welcome Email to the new user
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken(); // Since token is for a specific User
    res.status(201).json({ user, token }); // Created
  } catch (err) {
    res.status(400).json(err); // Bad Request
  }
});

// Updating the User's Profile
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body); // This is an array of the keys that are defined in the request body by the user
  const allowedUpdates = ["name", "email", "password", "age"];

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  // Even if one key does not belong to the allowedUpdates array then false will be returned by every()

  if (!isValidOperation) {
    return res.status(400).json({
      message: "Invalid Update Parameters!",
    });
  }

  try {
    // Runs for each key that is to be updated
    updates.forEach((update) => {
      req.user[update] = req.body[update]; // Setting the key to its corresponding value
    });

    await req.user.save();

    res.status(200).json(req.user);
  } catch (err) {
    res.status(400).json(err); // If validation error occurs
  }
});

// Deleting the user profile
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove(); // Removes the user
    // Sending the cancelation Email
    sendCancelationEmail(req.user.email, req.user.name);
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// User login route
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken(); // Since token is for a specific User

    res.status(200).json({ user, token });
  } catch (err) {
    res.status(400).json(err);
  }
});

// User Logout route
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    }); // Removing the current token from the tokens array

    await req.user.save();

    res.status(200).json({
      message: "User Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "A problem occured while logging out!",
    });
  }
});

// Logging out from all sessions
router.post("/users/logoutall", auth, async (req, res) => {
  try {
    req.user.tokens = []; // Wiping out the tokens array

    await req.user.save();

    res.status(200).json({
      message: "User Logged out from all sessions successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "A problem occured while logging out!",
    });
  }
});

module.exports = router;
