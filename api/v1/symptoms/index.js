const express = require("express");
const ApiError = require("../../../utils/error");
const { getUserInToken } = require("../middlewares");
const multer = require("multer");
const sequelize = require("sequelize");
const { Symptom_item } = require("../../../utils/models");

const router = express.Router();

const multerBody = multer();

router.post("/", getUserInToken, multerBody.none(), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name || name !== "") {
      await Symptom_item.create({
        name: name,
      });
      return res.status(201).json({
        statusCode: 201,
        body: { statusText: "Accepted", message: "증상 항목이 새로 등록되었습니다." },
      });
    } else {
      return res.status(404).json({
        statusCode: 404,
        body: { statusText: "Unaccepted", message: "입력한 이름의 값이 유효하지 않습니다." },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});
module.exports = router;
