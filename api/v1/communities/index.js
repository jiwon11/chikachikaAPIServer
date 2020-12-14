const express = require("express");
const ApiError = require("../../../utils/error");
const { getUserInToken } = require("../middlewares");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const sequelize = require("sequelize");
const { User, Community, Community_img, Symptom_item, Dental_clinic, Treatment_item, GeneralTag, Community_comment } = require("../../../utils/models");
const user = require("../../../utils/models/user");

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
    const { description, wantDentistHelp, type, images } = JSON.parse(req.body);
    console.log("images: ", image);
    const communityPost = await Community.create({
      description: description,
      wantDentistHelp: wantDentistHelp === "true",
      type: type,
      userId: req.user.id,
    });
    await Promise.all(
      images.map((image) =>
        Community_img.create({
          img_originalname: image.originalname,
          img_mimetype: image.mimetype,
          img_filename: image.key,
          img_size: image.size,
          img_url: image.location,
          img_index: image.index,
          communityId: communityPost.id,
        })
      )
    );
    var hashtags = [];
    const regex = /\{\{[가-힣|ㄱ-ㅎ|ㅏ-ㅣ|0-9|a-zA-Z]+\}\}/gm;
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
    for (const hashtag of hashtags) {
      let clinic = await Dental_clinic.findOne({
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
      } else {
        let treatment = await Treatment_item.findOne({
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
        } else {
          let symptom = await Symptom_item.findOne({
            where: {
              name: hashtag,
            },
          });
          if (symptom) {
            await communityPost.addSymptomItem(symptom, {
              through: {
                index: hashtags.indexOf(hashtag) + 1,
              },
            });
          } else {
            let generalTag = await GeneralTag.findOne({
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
            } else {
              let newGeneralTag = await GeneralTag.create({
                name: hashtag,
              });
              await communityPost.addGeneralTag(newGeneralTag, {
                through: {
                  index: hashtags.indexOf(hashtag) + 1,
                },
              });
            }
          }
        }
      }
    }
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
    const order = req.query.order === "createdAt" ? "createdAt" : "popular";
    const communityPosts = await Community.findAll({
      where: {
        type: type,
      },
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments ON (community_comments.id = Community_reply.commentId) WHERE community_comments.communityId = community.id)"
            ),
            "postCommentsNum",
          ],
          //[sequelize.literal("(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null)"), "postCommentsCount"],
          [sequelize.literal("(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)"), "postLikeNum"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id AND Like_Community.likerId = "${req.user.id}")`), "viewerLikeCommunityPost"],
          [sequelize.literal("(SELECT COUNT(*) FROM ViewCommunities WHERE ViewCommunities.viewedCommunityId = community.id)"), "postViewNum"],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
        },
        {
          model: Community_img,
          attributes: ["id", "img_originalname", "img_mimetype", "img_filename", "img_url", "img_size", "img_index"],
        },
        {
          model: Dental_clinic,
          as: "Clinics",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
        {
          model: Symptom_item,
          as: "SymptomItems",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
        {
          model: GeneralTag,
          as: "GeneralTags",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
      ],
      order: [
        [order, "DESC"],
        ["community_imgs", "img_index", "ASC"],
      ],
      offset: offset,
      limit: limit,
    });
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
    if (!communityPostId) {
      return res.status(400).json({
        statusCode: 400,
        body: {
          statusText: "Unaccepted",
          message: "Not Found Query",
        },
      });
    }
    const communityPost = await Community.findOne({
      where: {
        id: communityPostId,
      },
      attributes: [
        "id",
        "type",
        "description",
        "wantDentistHelp",
        "createdAt",
        "userId",
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments ON (community_comments.id = Community_reply.commentId) WHERE community_comments.communityId = community.id)"
          ),
          "postCommentsCount",
        ],
        [sequelize.literal("(SELECT COUNT(*) FROM ViewCommunities WHERE ViewCommunities.viewedCommunityId = community.id)"), "postViewNum"],
      ],
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
        },
        {
          model: Community_img,
        },
      ],
      order: [["community_imgs", "img_index", "ASC"]],
    });
    if (communityPost) {
      const symptomItems = await communityPost.getSymptomItems({
        attributes: ["id", "name"],
        through: {
          attributes: ["index"],
        },
      });
      const treatmentItems = await communityPost.getTreatmentItems({
        attributes: ["id", "name"],
        through: {
          attributes: ["index"],
        },
      });
      const clinics = await communityPost.getClinics({
        attributes: ["id", "name"],
      });
      const generalTags = await communityPost.getGeneralTags({
        attributes: ["id", "name"],
      });
      const tags = symptomItems.concat(treatmentItems, clinics, generalTags);
      tags.sort(function (a, b) {
        var nameA = a.hasOwnProperty("community_treatment")
          ? a["community_treatment"]["index"]
          : a.hasOwnProperty("community_dental_clinic")
          ? a["community_dental_clinic"]["index"]
          : a.hasOwnProperty("community_symptom")
          ? a["community_symptom"]["index"]
          : a.hasOwnProperty("communityGeneralTag")
          ? a["communityGeneralTag"]["index"]
          : null;
        var nameB = b.hasOwnProperty("community_treatment")
          ? b["community_treatment"]["index"]
          : b.hasOwnProperty("community_dental_clinic")
          ? b["community_dental_clinic"]["index"]
          : b.hasOwnProperty("community_symptom")
          ? b["community_symptom"]["index"]
          : b.hasOwnProperty("communityGeneralTag")
          ? b["communityGeneralTag"]["index"]
          : null;
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      const communityComments = await communityPost.getCommunity_comments({
        include: [
          {
            model: User,
          },
          {
            model: Community_comment,
            as: "Replys",
          },
        ],
      });
      const communityLikeNum = await communityPost.countLikers();
      const viewer = await User.findOne({
        where: {
          id: req.user.id,
        },
      });
      const viewerLikeCommunityPost = await communityPost.hasLikers(viewer);
      if (viewer.id !== communityPost.userId) {
        await communityPost.addViewer(viewer);
      }
      return res.status(200).json({
        communityPost: communityPost,
        tags: tags,
        communityComments: communityComments,
        communityLikeNum: communityLikeNum,
        viewerLikeCommunityPost: viewerLikeCommunityPost,
      });
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
    if (!postId) {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "postId가 없습니다." },
      });
    }
    const { description, wantDentistHelp, type, images } = JSON.parse(req.body);
    const communityPost = await Community.findOne({
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
    await communityPost.removeSymptomItems();
    await communityPost.removeGeneralTags();
    await Community_img.destroy({
      where: {
        communityId: communityPost.id,
      },
    });
    await Promise.all(
      images.map((image) =>
        Community_img.create({
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
    const regex = /\{\{[가-힣|ㄱ-ㅎ|ㅏ-ㅣ|0-9|a-zA-Z]+\}\}/gm;
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
    for (const hashtag of hashtags) {
      let clinic = await Dental_clinic.findOne({
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
      } else {
        let treatment = await Treatment_item.findOne({
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
        } else {
          let symptom = await Symptom_item.findOne({
            where: {
              name: hashtag,
            },
          });
          if (symptom) {
            await communityPost.addSymptomItem(symptom, {
              through: {
                index: hashtags.indexOf(hashtag) + 1,
              },
            });
          } else {
            let generalTag = await GeneralTag.findOne({
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
            } else {
              let newGeneralTag = await GeneralTag.create({
                name: hashtag,
              });
              await communityPost.addGeneralTag(newGeneralTag, {
                through: {
                  index: hashtags.indexOf(hashtag) + 1,
                },
              });
            }
          }
        }
      }
    }
    return res.status(200).json({
      statusCode: 200,
      body: { statusText: "Accepted", message: "수다방 글을 수정하였습니다." },
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
    const communityPost = await Community.findOne({
      where: {
        id: postId,
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
