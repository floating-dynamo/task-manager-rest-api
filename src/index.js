const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

// Middleware to log which method was used and which route was called
app.use((req, res, next) => {
  console.log(req.method, req.path);

  next();
});

// Parsing incoming JSON
app.use(express.json());

// Using the user router
app.use(userRouter);

// Using the task router
app.use(taskRouter);

app.listen(port, () => {
  console.log("Server started at port: ", port);
});
