const db = require("../utils/models");

module.exports.postClinicReport = async function postClinicReport(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const clinicId = event.queryStringParameters.clinicId;
      const body = JSON.parse(event.body);
      const bodyImages = body.images;
      var resonEx = body.reason.replace(/\[/g, "").replace(/\]/g, "").replace(/\'/g, "");
      const clinicReport = await db.Clinic_report.create({
        reason: resonEx,
        message: body.message,
        reporterId: userId,
        dentalClinicId: clinicId,
      });
      const images = await Promise.all(
        bodyImages.map((image) =>
          db.Clinic_report_img.create({
            img_originalname: image.originalname,
            img_mimetype: image.mimetype,
            img_filename: image.filename,
            img_size: image.size,
            img_url: image.location, //`${cloudFrontUrl}/${image.key}`
            img_index: bodyImages.indexOf(image) + 1,
            img_width: image.width,
            img_height: image.height,
            reportId: clinicReport.id,
          })
        )
      );
      console.log(images.length);
      return {
        statusCode: 200,
        body: `{"statusText": "OK","message": "수청 요청이 완료되었습니다."}`,
      };
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.reports = async function reports(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const body = JSON.parse(event.body);
      var resonEx = body.reason.replace(/\[/g, "").replace(/\]/g, "").replace(/\'/g, "");
      const targetType = event.queryStringParameters.targetType;
      const targetId = event.queryStringParameters.targetId;
      if (targetType === "user") {
        const targetUser = await db.User.findOne({
          where: {
            id: targetId,
          },
        });
        if (targetUser) {
          await db.Report.create({
            reason: resonEx,
            message: body.message,
            reporterId: user.id,
            userId: targetId,
          });
        } else {
          return {
            statusCode: 404,
            body: `{"statusText": "Not Found","message": "요청한 사용자를 찾을 수 없습니다."}`,
          };
        }
      } else if (targetType === "review") {
        const targetReview = await db.Review.findOne({
          where: {
            id: targetId,
          },
        });
        if (targetReview) {
          await db.Report.create({
            reason: resonEx,
            message: body.message,
            reporterId: user.id,
            reviewId: targetId,
          });
        } else {
          return {
            statusCode: 404,
            body: `{"statusText": "Not Found","message": "요청한 리뷰를 찾을 수 없습니다."}`,
          };
        }
      } else if (targetType === "community") {
        const targetPost = await db.Community.findOne({
          where: {
            id: targetId,
          },
        });
        if (targetPost) {
          await db.Report.create({
            reason: resonEx,
            message: body.message,
            reporterId: user.id,
            communityId: targetId,
          });
        } else {
          return {
            statusCode: 404,
            body: `{"statusText": "Not Found","message": "요청한 수다방 글을 찾을 수 없습니다."}`,
          };
        }
      } else {
        return {
          statusCode: 400,
          body: `{ "statusText": "Bad Request", "message": "유효하지 않는 쿼리 파라미터입니다." }`,
        };
      }
      return {
        statusCode: 200,
        body: `{"statusText": "OK","message": "신고 내용이 접수되었습니다."}`,
      };
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
