const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

// Creating a User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Making 'name' a required field
      trim: true, // Get rid of extra spaces
    },
    email: {
      type: String,
      unique: true, // user can use only a single email to register once
      required: true,
      trim: true,
      lowercase: true,
      // Validating the Email
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("The Email is invalid");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    // Password -> required, trim, minimum length > 6 & cannot be = 'password'
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

// Setting up a virtual property
// This is a relationship between two entities
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id", // _id(user) -> owner(task)
  foreignField: "owner",
});

// Generating the Auth Token for the user
userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  // Saving the token to tokens field in the DB
  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// Returning user data that is not private
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject(); // This function is provided by mongoose to return the raw data

  delete userObject.password; // removing the password field
  delete userObject.tokens; // removing the tokens array
  delete userObject.avatar // To speed up the fetch req

  return userObject;
};

// Creating a custom function for user login
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login!");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login!");
  }

  return user;
};

// Before saving the schema this function will run
userSchema.pre("save", async function (next) {
  const user = this; // References the current user being saved

  // Hashing the Password before saving the user
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Delete the user's tasks when the user is removed
userSchema.pre("remove", async function (next) {
  const user = this;

  // Cascade delete the taks
  await Task.deleteMany({ owner: user._id });

  next();
});

// Creating the User Model
const User = mongoose.model("User", userSchema);

User.createIndexes();

module.exports = User;
