const express = require("express");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");
const sequelize = require("sequelize");
const ApiError = require("../../../utils/error");
const { getUserInToken } = require("../middlewares");
const { Review, User, Review_content, Treatment_item, Dental_clinic, Review_treatment_item, Review_comment } = require("../../../utils/models");

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

router.get("/lists", getUserInToken, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const order =
      req.query.order === "createdAt"
        ? ["createdAt", "DESC"]
        : [
            sequelize.literal(
              "(((SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)*3)+ (SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)) DESC"
            ),
          ];
    const reviews = await Review.findAll({
      attributes: {
        include: [
          [sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.updatedAt,NOW()))`), "createdDiff(second)"],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM review_comments WHERE review_comments.reviewId = review.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Review_reply LEFT JOIN review_comments ON (review_comments.id = Review_reply.commentId) WHERE review_comments.reviewId = review.id)"
            ),
            "reviewCommentsNum",
          ],
          [sequelize.literal("(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)"), "reviewLikeNum"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id AND Like_Review.likerId = "${req.user.id}")`), "viewerLikedReview"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Scrap WHERE Scrap.scrapedReviewId = review.id AND Scrap.scraperId = "${req.user.id}")`), "viewerScrapedReview"],
          [sequelize.literal("(SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)"), "reviewViewNum"],
          [
            sequelize.literal(
              "(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ' ') FROM review_contents WHERE review_contents.reviewId = review.id AND review_contents.deletedAt IS NULL)"
            ),
            "reviewDescriptions",
          ],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
        },
        {
          model: Review_content,
          attributes: ["id", "img_url", "index", "img_before_after"],
          required: false,
          where: {
            img_url: {
              [sequelize.Op.not]: null,
            },
          },
        },
        {
          model: Dental_clinic,
          attributes: ["id", "name"],
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          attributes: ["id", "name"],
          order: [["index", "ASC"]],
          through: {
            model: Review_treatment_item,
            attributes: ["cost", "index"],
          },
        },
      ],
      limit: limit,
      offset: offset,
      order: [order, ["TreatmentItems", Review_treatment_item, "index", "ASC"], ["review_contents", "index", "ASC"]],
    });
    console.log(reviews.length);
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/", getUserInToken, async (req, res, next) => {
  try {
    const reviewId = req.query.reviewId;
    if (!reviewId) {
      return res.status(404).json({
        statusCode: 404,
        body: {
          statusText: "Not Found",
          message: "Not Found Query",
        },
      });
    }
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
      attributes: {
        include: [[sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.updatedAt,NOW()))`), "createdDiff(second)"]],
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
          attributes: ["id", "name"],
          through: {
            model: Review_treatment_item,
            attributes: ["cost", "index"],
          },
        },
      ],
      order: [
        ["review_contents", "index", "ASC"],
        ["TreatmentItems", Review_treatment_item, "index", "ASC"],
      ],
    });
    if (review) {
      const reviewComments = await review.getReview_comments({
        include: [
          {
            model: User,
            attributes: ["id", "nickname", "profileImg"],
          },
          {
            model: Review_comment,
            as: "Replys",
            include: [
              {
                model: User,
                attributes: ["id", "nickname", "profileImg"],
              },
            ],
          },
        ],
      });
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
      const viewerScrapReview = await review.hasScrapers(viewer);
      return res.status(200).json({
        reviewBody: review,
        reviewViewerNum: reviewViewerNum,
        reviewComments: reviewComments,
        reviewLikeNum: reviewLikeNum,
        viewerLikeReview: viewerLikeReview,
        viewerScrapReview: viewerScrapReview,
      });
    } else {
      return res.status(404).json({
        statusCode: 404,
        body: { statusText: "Not Found", message: "리뷰를 찾을 수 없습니다." },
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

/**
 * header 값에 "content-type": "multipart/form-data" 추가 필요
 */
router.post("/", getUserInToken, reviewImgUpload.none(), async (req, res, next) => {
  try {
    const paragraphs = JSON.parse(req.body.paragraphs);
    console.log("paragraphs: ", paragraphs);
    const body = req.body.body;
    const { starRate_cost, starRate_treatment, starRate_service, certified_bill, treatments, dentalClinicId, totalCost, treatmentDate } = JSON.parse(body);
    console.log(`treatmentDate : ${treatmentDate}`);
    var parseTreatmentDate;
    if (treatmentDate !== "undefined" && treatmentDate) {
      parseTreatmentDate = new Date(treatmentDate);
      console.log(`parseTreatmentDate : ${parseTreatmentDate}`);
    } else {
      parseTreatmentDate = new Date();
    }
    const review = await Review.create({
      certifiedBill: certified_bill,
      starRate_cost: parseFloat(starRate_cost),
      starRate_service: parseFloat(starRate_service),
      starRate_treatment: parseFloat(starRate_treatment),
      totalCost: parseInt(totalCost),
      treatmentDate: parseTreatmentDate,
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
            index: treatments.indexOf(treatment) + 1,
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
    const contents = await Promise.all(
      paragraphs.map((paragraph) =>
        Review_content.create({
          img_url: paragraph.location, //`${cloudFrontUrl}/${image.key}`
          img_name: paragraph.originalname,
          mime_type: paragraph.mimetype,
          img_size: paragraph.size,
          index: paragraphs.indexOf(paragraph) + 1,
          description: paragraph.description,
          img_before_after: paragraph.imgBeforeAfter,
          reviewId: review.id,
        })
      )
    );
    console.log(`콘텐츠 개수 : ${contents.length}`);
    return res.status(201).json({
      statusCode: 201,
      body: { statusText: "Accepted", message: "리뷰 작성이 완료되었습니다!" },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.put("/", getUserInToken, reviewImgUpload.none(), async (req, res, next) => {
  try {
    const reviewId = req.query.reviewId;
    const paragraphs = JSON.parse(req.body.paragraphs);
    const body = req.body.body;
    const { starRate_cost, starRate_treatment, starRate_service, certified_bill, treatments, dentalClinicId, totalCost, treatmentDate } = JSON.parse(body);
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
    });
    if (review) {
      if (review.userId === req.user.id) {
        var parseTreatmentDate;
        if (treatmentDate !== "undefined" && treatmentDate) {
          parseTreatmentDate = new Date(treatmentDate);
        } else {
          parseTreatmentDate = new Date();
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
          totalCost: parseInt(totalCost),
          treatmentDate: parseTreatmentDate,
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
                index: treatments.indexOf(treatment) + 1,
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
          paragraphs.map((paragraph) =>
            Review_content.create({
              img_url: paragraph.location, //`${cloudFrontUrl}/${image.key}`
              img_name: paragraph.originalname,
              mime_type: paragraph.mimetype,
              img_size: paragraph.size,
              index: paragraphs.indexOf(paragraph) + 1,
              description: paragraph.description,
              img_before_after: paragraph.imgBeforeAfter,
              reviewId: review.id,
            })
          )
        );
        console.log(`콘텐츠 개수 : ${contents.length}`);
        const updateReview = await Review.findOne({
          where: {
            id: review.id,
          },
          attributes: {
            include: [[sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.updatedAt,NOW()))`), "createdDiff(second)"]],
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
              attributes: ["id", "name"],
              through: {
                model: Review_treatment_item,
                attributes: ["cost", "index"],
              },
            },
          ],
          order: [
            ["review_contents", "index", "ASC"],
            ["TreatmentItems", Review_treatment_item, "index", "ASC"],
          ],
        });
        if (updateReview) {
          const reviewComments = await updateReview.getReview_comments({
            include: [
              {
                model: User,
                attributes: ["id", "nickname", "profileImg"],
              },
              {
                model: Review_comment,
                as: "Replys",
                include: [
                  {
                    model: User,
                    attributes: ["id", "nickname", "profileImg"],
                  },
                ],
              },
            ],
          });
          const reviewLikeNum = await updateReview.countLikers();
          const reviewViewerNum = await updateReview.countViewers();
          const viewer = await User.findOne({
            where: {
              id: req.user.id,
            },
          });
          if (viewer.id !== updateReview.userId) {
            await updateReview.addViewer(updateReview);
          }
          const viewerLikeReview = await updateReview.hasLikers(viewer);
          const viewerScrapReview = await review.hasScrapers(viewer);
          const updateReviewResult = {
            reviewBody: updateReview,
            reviewViewerNum: reviewViewerNum,
            reviewComments: reviewComments,
            reviewLikeNum: reviewLikeNum,
            viewerLikeReview: viewerLikeReview,
            viewerScrapReview: viewerScrapReview,
          };
          return res.status(200).json({
            statusCode: 200,
            message: "리뷰글을 수정하였습니다.",
            updateReview: updateReviewResult,
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
