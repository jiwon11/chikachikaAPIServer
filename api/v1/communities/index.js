const express = require("express");
const { getUserInToken } = require("../middlewares");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const db = require("../../../utils/models");
const Sequelize = require("sequelize");

const router = express.Router();

const communityImgUpload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: "chikachika-community-images",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(req, file, cb) {
      cb(null, `original/${+Date.now()}${path.basename(file.originalname.replace(/ /gi, ""))}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.post("/", getUserInToken, communityImgUpload.none(), async (req, res, next) => {
  try {
    console.log(req.body);
    const description = req.body.description;
    const type = req.body.type;
    const wantDentistHelp = req.body.type;
    const images = JSON.parse(req.body.images);
    const user = await db.User.findOne({
      where: {
        id: req.user.id,
      },
    });
    const city = await user.getResidences({
      attributes: ["id"],
      through: {
        where: {
          now: true,
        },
      },
    });
    console.log("images: ", images);
    const communityPost = await db.Community.create({
      description: description,
      wantDentistHelp: wantDentistHelp === "true",
      type: type,
      userId: req.user.id,
      cityId: city[0].id,
    });
    await Promise.all(
      images.map((image) =>
        db.Community_img.create({
          img_originalname: image.originalname,
          img_mimetype: image.mimetype,
          img_filename: image.key,
          img_size: image.size,
          img_url: image.location,
          img_index: image.index,
          img_width: image.width,
          img_height: image.height,
          communityId: communityPost.id,
        })
      )
    );
    var hashtags = [];
    const regex = /\{\{[가-힣|ㄱ-ㅎ|ㅏ-ㅣ|0-9|a-zA-Z|(|)|([\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\")]*\}\}/gm;
    let m;
    while ((m = regex.exec(description)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      m.forEach((match, groupIndex) => {
        if (groupIndex === 0) {
          match = match.replace(/\{/g, "");
          match = match.replace(/\}/g, "");
          hashtags.push(match);
          //console.log(`Found match, group ${groupIndex}: ${match}`);
        }
      });
    }
    tagArray = [];
    for (const hashtag of hashtags) {
      console.log(hashtag);
      let clinic = await db.Dental_clinic.findOne({
        where: {
          name: hashtag,
        },
      });
      if (clinic) {
        await communityPost.addClinic(clinic, {
          through: {
            index: hashtags.indexOf(hashtag) + 1,
          },
        });
        tagArray.push({ name: clinic.name, category: "clinic", id: clinic.id });
      } else {
        let treatment = await db.Treatment_item.findOne({
          where: {
            name: hashtag,
          },
        });
        if (treatment) {
          await communityPost.addTreatmentItem(treatment, {
            through: {
              index: hashtags.indexOf(hashtag) + 1,
            },
          });
          tagArray.push({ name: treatment.name, category: "treatment", id: treatment.id });
        } else {
          let city = await db.City.findOne({
            where: {
              [Sequelize.Op.or]: [
                Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("emdName"), "(", Sequelize.fn("REPLACE", Sequelize.col("sigungu"), " ", "-"), ")"), {
                  [Sequelize.Op.like]: `${hashtag}`,
                }),
              ],
            },
          });
          if (city) {
            await communityPost.addCityTag(city, {
              through: {
                index: hashtags.indexOf(hashtag) + 1,
              },
            });
            tagArray.push({ name: city.name, category: "city", id: city.id });
          } else {
            let generalTag = await db.GeneralTag.findOne({
              where: {
                name: hashtag,
              },
            });
            if (generalTag) {
              await communityPost.addGeneralTag(generalTag, {
                through: {
                  index: hashtags.indexOf(hashtag) + 1,
                },
              });
              tagArray.push({ name: generalTag.name, category: "general", id: generalTag.id });
            } else {
              let newGeneralTag = await db.GeneralTag.create({
                name: hashtag,
              });
              await communityPost.addGeneralTag(newGeneralTag, {
                through: {
                  index: hashtags.indexOf(hashtag) + 1,
                },
              });
              tagArray.push({ name: newGeneralTag.name, category: "general", id: newGeneralTag.id });
            }
          }
        }
      }
    }
    await communityPost.update({
      tagArray: { tagArray: tagArray },
    });
    return res.status(201).json({
      statusCode: 201,
      body: { statusText: "Accepted", message: "수다방 글 작성이 완료되었습니다!" },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/lists", getUserInToken, async (req, res, next) => {
  try {
    const type = req.query.type === "All" ? ["Question", "FreeTalk"] : [req.query.type];
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const order = req.query.order;
    const cityId = req.query.cityId;
    const region = req.query.region;
    const userId = req.user.id;
    var clusterQuery;
    if (region === "residence") {
      var userResidence = await db.City.findOne({
        where: {
          id: cityId,
        },
      });
      clusterQuery = userResidence.newTownId
        ? {
            newTownId: userResidence.newTownId,
          }
        : {
            sido: userResidence.sido,
            sigungu: userResidence.sigungu,
          };
    } else if (region !== "all") {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 쿼리입니다." },
      });
    }
    console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
    const communityPosts = await db.Community.getAll(db, userId, type, clusterQuery, order, offset, limit);
    return res.json(communityPosts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/", getUserInToken, async (req, res, next) => {
  try {
    const communityPostId = req.query.postId;
    const userId = req.user.id;
    if (!communityPostId) {
      return res.status(400).json({
        statusCode: 400,
        body: {
          statusText: "Unaccepted",
          message: "Not Found Query",
        },
      });
    }
    const communityPost = await db.Community.getOne(db, userId, communityPostId);
    if (communityPost) {
      const viewer = await db.User.findOne({
        where: {
          id: req.user.id,
        },
      });
      if (viewer.id !== communityPost.userId) {
        await communityPost.addViewer(viewer);
      }
      return res.status(200).json(communityPost);
    } else {
      return res.status(404).json({
        statusCode: 404,
        body: {
          statusText: "Unaccepted",
          message: "Not Found Post!",
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.put("/", getUserInToken, communityImgUpload.none(), async (req, res, next) => {
  try {
    const postId = req.query.postId;
    const userId = req.user.id;
    if (!postId) {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "postId가 없습니다." },
      });
    }
    console.log(req.body);
    const description = req.body.description;
    const type = req.body.type;
    const wantDentistHelp = req.body.type;
    const images = JSON.parse(req.body.images);
    console.log("images: ", images);
    const communityPost = await db.Community.findOne({
      where: {
        id: postId,
        userId: req.user.id,
      },
    });
    if (!communityPost) {
      return res.status(404).json({
        statusCode: 404,
        body: { statusText: "Not Found", message: "수정할 게시글이 존재하지 않습니다." },
      });
    }
    if (communityPost.userId !== req.user.id) {
      return res.status(401).json({
        statusCode: 404,
        body: { statusText: "Unauthorized", message: "게시글을 삭제할 권한이 없습니다." },
      });
    }
    await communityPost.update({
      description: description,
      wantDentistHelp: wantDentistHelp === "true",
      type: type,
      userId: req.user.id,
    });
    await communityPost.removeClinics();
    await communityPost.removeTreatmentItems();
    await communityPost.removeGeneralTags();
    await db.Community_img.destroy({
      where: {
        communityId: communityPost.id,
      },
    });
    await Promise.all(
      images.map((image) =>
        db.Community_img.create({
          img_originalname: image.originalname,
          img_mimetype: image.mimetype,
          img_filename: image.key,
          img_size: image.size,
          img_url: image.location,
          img_index: images.indexOf(image) + 1,
          communityId: communityPost.id,
        })
      )
    );
    var hashtags = [];
    const regex = /\{\{[가-힣|ㄱ-ㅎ|ㅏ-ㅣ|0-9|a-zA-Z|(|)|([\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\")]*\}\}/gm;
    let m;
    while ((m = regex.exec(description)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      m.forEach((match, groupIndex) => {
        if (groupIndex === 0) {
          match = match.replace(/\{/g, "");
          match = match.replace(/\}/g, "");
          hashtags.push(match);
          //console.log(`Found match, group ${groupIndex}: ${match}`);
        }
      });
    }
    tagArray = [];
    for (const hashtag of hashtags) {
      console.log(hashtag);
      let clinic = await db.Dental_clinic.findOne({
        where: {
          name: hashtag,
        },
      });
      if (clinic) {
        await communityPost.addClinic(clinic, {
          through: {
            index: hashtags.indexOf(hashtag) + 1,
          },
        });
        tagArray.push({ name: clinic.name, category: "clinic", id: clinic.id });
      } else {
        let treatment = await db.Treatment_item.findOne({
          where: {
            name: hashtag,
          },
        });
        if (treatment) {
          await communityPost.addTreatmentItem(treatment, {
            through: {
              index: hashtags.indexOf(hashtag) + 1,
            },
          });
          tagArray.push({ name: treatment.name, category: "treatment", id: treatment.id });
        } else {
          let city = await db.City.findOne({
            where: {
              [Sequelize.Op.or]: [
                Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("emdName"), "(", Sequelize.fn("REPLACE", Sequelize.col("sigungu"), " ", "-"), ")"), {
                  [Sequelize.Op.like]: `${hashtag}`,
                }),
              ],
            },
          });
          if (city) {
            await communityPost.addCityTag(city, {
              through: {
                index: hashtags.indexOf(hashtag) + 1,
              },
            });
            tagArray.push({ name: city.name, category: "city", id: city.id });
          } else {
            let generalTag = await db.GeneralTag.findOne({
              where: {
                name: hashtag,
              },
            });
            if (generalTag) {
              await communityPost.addGeneralTag(generalTag, {
                through: {
                  index: hashtags.indexOf(hashtag) + 1,
                },
              });
              tagArray.push({ name: generalTag.name, category: "general", id: generalTag.id });
            } else {
              let newGeneralTag = await db.GeneralTag.create({
                name: hashtag,
              });
              await communityPost.addGeneralTag(newGeneralTag, {
                through: {
                  index: hashtags.indexOf(hashtag) + 1,
                },
              });
              tagArray.push({ name: newGeneralTag.name, category: "general", id: newGeneralTag.id });
            }
          }
        }
      }
    }
    await communityPost.update({
      tagArray: { tagArray: tagArray },
    });
    const updateCommunityPost = await db.Community.getOne(db, userId, communityPost.id);
    return res.status(200).json({
      statusCode: 200,
      body: { statusText: "Accepted", message: "수다방 글을 수정하였습니다.", updateCommunityPost: updateCommunityPost },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.delete("/", getUserInToken, async (req, res, next) => {
  try {
    const postId = req.query.postId;
    const communityPost = await db.Community.findOne({
      where: {
        id: postId,
        userId: {
          [Sequelize.Op.not]: null,
        },
      },
    });
    if (communityPost) {
      if (communityPost.userId === req.user.id) {
        await communityPost.destroy({
          force: true,
        });
        return res.status(204).json({
          message: "DELETE Review!",
        });
      } else {
        return res.status(401).json({
          statusCode: 401,
          body: { statusText: "Unauthorized", message: "게시글을 삭제할 권한이 없습니다." },
        });
      }
    } else {
      return res.status(404).json({
        statusCode: 404,
        body: { statusText: "Not Found", message: "삭제할 수 있는 게시글이 없습니다." },
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
