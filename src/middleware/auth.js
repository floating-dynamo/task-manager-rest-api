const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", ""); // Remove Bearer String so that we can access only the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    }); // Find the user with the id and the correct auth token present in the tokens array

    if (!user) {
      throw new Error();
    }

    req.token = token; // To pass to the route handler
    req.user = user; // To pass to the route handler
    next();
  } catch (err) {
    res.status(401).json({
      message: "The user is not authenticated!",
    });
  }
};

module.exports = auth;
