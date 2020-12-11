const express = require("express");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");
const ApiError = require("../../../utils/error");
const { getUserInToken } = require("../middlewares");
const { Review, User, Review_content, Treatment_item, Dental_clinic, Review_treatment_item } = require("../../../utils/models");

const router = express.Router();

const cloudFrontUrl = "";

AWS.config.update({
  accessKeyId: process.env.AWS_Access_Key_ID,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: "ap-northeast-2",
});

const reviewImgUpload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: "chikachika-review-images",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(req, file, cb) {
      cb(null, `original/${+Date.now()}${path.basename(file.originalname.replace(/ /gi, ""))}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.get("/", getUserInToken, async (req, res, next) => {
  try {
    const reviewId = req.query.reviewId;
    if (!reviewId) {
      return res.status(404).json({
        statusCode: 404,
        body: {
          statusText: "Unaccepted",
          message: "Not Found Query",
        },
      });
    }
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
        },
        {
          model: Dental_clinic,
          attributes: ["name", "address"],
        },
        {
          model: Review_content,
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          attributes: ["name"],
          through: {
            attributes: ["cost"],
          },
        },
      ],
      order: [["review_contents", "index", "ASC"]],
    });
    const reviewComments = await review.getReview_comments();
    const reviewLikeNum = await review.countLikers();
    const reviewViewerNum = await review.countViewers();
    const viewer = await User.findOne({
      where: {
        id: req.user.id,
      },
    });
    if (viewer.id !== review.userId) {
      await review.addViewer(viewer);
    }
    const viewerLikeReview = await review.hasLikers(viewer);
    return res.status(200).json({
      reivewBody: review,
      reviewViewerNum: reviewViewerNum,
      reviewComments: reviewComments,
      reviewLikeNum: reviewLikeNum,
      viewerLikeReview: viewerLikeReview,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

/**
 * header 값에 "content-type": "multipart/form-data" 추가 필요
 */
router.post("/", getUserInToken, reviewImgUpload.array("images"), async (req, res, next) => {
  try {
    const images = req.files;
    const { descriptions, starRate_cost, starRate_treatment, starRate_service, certified_bill, treatments, dentalClinicId, imgBeforeAfters } = JSON.parse(req.body.body);
    if (images.length === descriptions.length && descriptions.length === imgBeforeAfters.length) {
      var concsulationDate;
      if (req.body.concsulationDate !== "undefined" && req.body.concsulationDate) {
        concsulationDate = new Date(req.body.concsulationDate);
      } else {
        concsulationDate = new Date();
      }
      const review = await Review.create({
        certifiedBill: certified_bill,
        starRate_cost: parseFloat(starRate_cost),
        starRate_service: parseFloat(starRate_service),
        starRate_treatment: parseFloat(starRate_treatment),
        concsulationDate: concsulationDate,
        userId: req.user.id,
        dentalClinicId: dentalClinicId,
      });
      for (const treatment of treatments) {
        const treatmentItem = await Treatment_item.findOne({
          where: {
            id: treatment.id,
          },
        });
        if (treatmentItem) {
          await review.addTreatmentItem(treatmentItem, {
            through: {
              cost: treatment.cost,
            },
          });
        } else {
          console.log(treatmentItem);
          return res.status(404).json({
            statusCode: 404,
            body: { statusText: "Unaccepted", message: "진료 항목을 찾을 수 없습니다." },
          });
        }
      }
      console.log(`치료 항목 개수 : ${treatments.length}`);
      const contents = await Promise.all(
        images.map((image) =>
          Review_content.create({
            img_url: image.location, //`${cloudFrontUrl}/${image.key}`
            img_name: image.originalname,
            mime_type: image.mimetype,
            img_size: image.size,
            index: images.indexOf(image) + 1,
            description: descriptions[images.indexOf(image)],
            img_before_after: imgBeforeAfters[images.indexOf(image)],
            reviewId: review.id,
          })
        )
      );
      console.log(`콘텐츠 개수 : ${contents.length}`);
      return res.status(201).json({
        statusCode: 201,
        body: { statusText: "Accepted", message: "리뷰 작성이 완료되었습니다!" },
      });
    } else {
      return res.status(403).json({
        statusCode: 403,
        body: { statusText: "Unaccepted", message: "이미지 개수와 글 개수와 이미지 전후 개수가 다릅니다." },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.put("/", getUserInToken, reviewImgUpload.array("images"), async (req, res, next) => {
  try {
    const reviewId = req.query.reviewId;
    const images = req.files;
    const { descriptions, starRate_cost, starRate_treatment, starRate_service, certified_bill, treatments, dentalClinicId, imgBeforeAfters } = JSON.parse(req.body.body);
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
    });
    if (review) {
      if (review.userId === req.user.id) {
        if (images.length === descriptions.length && descriptions.length === imgBeforeAfters.length) {
          var concsulationDate;
          if (req.body.concsulationDate !== "undefined" && req.body.concsulationDate) {
            concsulationDate = new Date(req.body.concsulationDate);
          } else {
            concsulationDate = new Date();
          }
          await Review_content.destroy({
            where: {
              reviewId: review.id,
            },
          });
          await Review_treatment_item.destroy({
            where: {
              reviewId: review.id,
            },
            force: true,
          });
          await review.update({
            certifiedBill: certified_bill,
            starRate_cost: parseFloat(starRate_cost),
            starRate_service: parseFloat(starRate_service),
            starRate_treatment: parseFloat(starRate_treatment),
            concsulationDate: concsulationDate,
            userId: req.user.id,
            dentalClinicId: dentalClinicId,
          });
          for (const treatment of treatments) {
            const treatmentItem = await Treatment_item.findOne({
              where: {
                id: treatment.id,
              },
            });
            if (treatmentItem) {
              await review.addTreatmentItem(treatmentItem, {
                through: {
                  cost: treatment.cost,
                },
              });
            } else {
              console.log(treatmentItem);
              return res.status(404).json({
                statusCode: 404,
                body: { statusText: "Unaccepted", message: "진료 항목을 찾을 수 없습니다." },
              });
            }
          }
          console.log(`치료 항목 개수 : ${treatments.length}`);
          const contents = await Promise.all(
            images.map((image) =>
              Review_content.create({
                img_url: image.location, //`${cloudFrontUrl}/${image.key}`
                img_name: image.originalname,
                mime_type: image.mimetype,
                img_size: image.size,
                index: images.indexOf(image) + 1,
                description: descriptions[images.indexOf(image)],
                img_before_after: imgBeforeAfters[images.indexOf(image)],
                reviewId: review.id,
              })
            )
          );
          console.log(`콘텐츠 개수 : ${contents.length}`);
          return res.status(200).json({
            statusCode: 200,
            message: "리뷰글을 수정하였습니다.",
          });
        } else {
          return res.status(403).json({
            statusCode: 403,
            body: { statusText: "Unaccepted", message: "이미지 개수와 글 개수와 이미지 전후 개수가 다릅니다." },
          });
        }
      } else {
        return res.status(401).json({
          statusCode: 401,
          body: { statusText: "Unauthorized", message: "글을 수정할 권한이 없습니다." },
        });
      }
    } else {
      return res.status(404).json({
        statusCode: 404,
        body: { statusText: "Unauthorized", message: "리뷰가 없습니다." },
      });
    }
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
    const reviewId = req.query.reviewId;
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
    });
    if (review.userId === req.user.id) {
      await review.destroy({
        force: true,
      });
      await Review_content.destroy({
        where: {
          reviewId: review.id,
        },
      });
      await Review_treatment_item.destroy({
        where: {
          reviewId: review.id,
        },
      });
      return res.status(204).json({
        message: "DELETE Review!",
      });
    } else {
      return res.status(401).json({
        statusCode: 401,
        body: { statusText: "Unauthorized", message: "글을 삭제할 권한이 없습니다." },
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
