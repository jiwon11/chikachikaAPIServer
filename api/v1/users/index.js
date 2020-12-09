const express = require("express");
const ApiError = require("../../../utils/error");
const { getUserInToken } = require("../middlewares");

const router = express.Router();

// CRUD example
router.get("/", getUserInToken, async (req, res, next) => {
  console.log(req.user);
  res.send("get all users");
});

module.exports = router;
