const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.json({
    message: "Backend is running"
  });
});


app.get("/api", (req, res) => {
  res.json({
    message: "API is working"
  });
});

app.use("/api/auth", authRoutes);


module.exports = app;
