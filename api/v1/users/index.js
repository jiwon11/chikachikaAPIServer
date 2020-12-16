const express = require("express");
const multer = require("multer");
const moment = require("moment");
const { User } = require("../../../utils/models");
const { getUserInToken } = require("../middlewares");

const router = express.Router();

const userProfileUpload = multer();
// CRUD example
router.get("/", getUserInToken, async (req, res, next) => {
  console.log(req.user);
  res.send("get all users");
});

router.put("/", getUserInToken, userProfileUpload.none(), async (req, res, next) => {
  try {
    console.log(req.body);
    const userId = req.user.id;
    const nickname = req.body.nickname | (req.body.nickname !== "") ? req.body.nickname : undefined;
    const gender = req.body.gender | (req.body.gender !== "") ? req.body.gender : undefined;
    const birthdate = req.body.birthdate | (req.body.birthdate !== "") ? req.body.birthdate : undefined;
    const profileImg = req.body.profileImg | (req.body.birthdate !== "") ? req.body.profileImg : undefined;
    if (nickname) {
      const uniqNickname = await User.findOne({
        where: {
          nickname: nickname,
        },
        attributes: ["id", "nickname"],
      });
      if (uniqNickname.id !== userId) {
        return res.status(403).json({
          statusCode: 403,
          body: { statusText: "Unaccepted", message: "이미 있는 닉네임입니다." },
        });
      }
    }
    await User.update(
      {
        nickname: nickname,
        gender: gender,
        birthdate: birthdate,
        profileImg: profileImg,
      },
      {
        where: {
          id: userId,
        },
      }
    );
    return res.status(200).json({
      statusCode: 200,
      body: { statusText: "Accepted", message: "프로필을 업데이트하였습니다." },
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

module.exports = router;
