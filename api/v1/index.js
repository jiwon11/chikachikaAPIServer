const express = require("express");
const router = express.Router();
const routes = ["users", "reviews", "treatments", "symptoms", "communities", "comments"];

routes.forEach((route) => router.use("/" + route, require("./" + route)));

module.exports = router;
