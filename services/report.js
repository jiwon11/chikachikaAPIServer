const db = require("../utils/models");
const reportConsumer = require("../utils/Class/SQSconsumer").report;

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
      const clinic = await db.Dental_clinic.findOne({ where: { id: clinicId } });
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
      const message = {
        attachments: [
          {
            fallback: `${clinic.originalName}에 대한 새로운 수정 요청이 접수 되었습니다.`,
            color: "#D00000",
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `${clinic.originalName}에 대한 새로운 수정 요청이 접수 되었습니다.`,
                  emoji: true,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*사유* : ${resonEx}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*내용* : ${body.message}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*병원 이름* : ${clinic.originalName} , *병원 ID* : ${clinic.id}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*신고자 닉네임* : ${user.nickname} , *신고자 ID* : ${user.id}`,
                },
              },
            ],
          },
        ],
      };
      if (images.length > 0) {
        images.forEach((image) => {
          message.attachments[0].blocks.push({
            type: "image",
            image_url: image.img_url,
            alt_text: "inspiration",
          });
        });
      }
      const reportMessage = {
        slackBody: {
          messageBody: message,
          webhookUri: "https://hooks.slack.com/services/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",
        },
        group: `clinicReport`,
        id: clinicReport.id,
      };
      const reportNotification = await reportConsumer(reportMessage);
      if (reportNotification.statusCode === 200) {
        console.log(JSON.parse(reportNotification.body));
      }
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
      var targetTypeKor;
      var reportId;
      var webhookUri;
      if (targetType === "user") {
        targetTypeKor = "사용자";
        webhookUri = "https://hooks.slack.com/services/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";
        const targetUser = await db.User.findOne({
          where: {
            id: targetId,
          },
        });
        if (targetUser) {
          const report = await db.Report.create({
            reason: resonEx,
            message: body.message,
            reporterId: user.id,
            userId: targetId,
          });
          reportId = report.id;
        } else {
          return {
            statusCode: 404,
            body: `{"statusText": "Not Found","message": "요청한 사용자를 찾을 수 없습니다."}`,
          };
        }
      } else if (targetType === "review") {
        targetTypeKor = "리뷰";
        webhookUri = "https://hooks.slack.com/services/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";
        const targetReview = await db.Review.findOne({
          where: {
            id: targetId,
          },
        });
        if (targetReview) {
          const report = await db.Report.create({
            reason: resonEx,
            message: body.message,
            reporterId: user.id,
            reviewId: targetId,
          });
          reportId = report.id;
        } else {
          return {
            statusCode: 404,
            body: `{"statusText": "Not Found","message": "요청한 리뷰를 찾을 수 없습니다."}`,
          };
        }
      } else if (targetType === "community") {
        targetTypeKor = "수다방 글";
        webhookUri = "https://hooks.slack.com/services/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";
        const targetPost = await db.Community.findOne({
          where: {
            id: targetId,
          },
        });
        if (targetPost) {
          const report = await db.Report.create({
            reason: resonEx,
            message: body.message,
            reporterId: user.id,
            communityId: targetId,
          });
          reportId = report.id;
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
      const message = {
        attachments: [
          {
            fallback: `${targetTypeKor}에 대한 새로운 신고가 접수 되었습니다.`,
            color: "#D00000",
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `${targetTypeKor}에 대한 새로운 신고가 접수 되었습니다.`,
                  emoji: true,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*ADMIN 링크* : <https://example.com/reports/${reportId}>`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*사유* : ${resonEx}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*신고자 닉네임* : ${user.nickname} , *신고자 ID* : ${user.id}`,
                },
              },
            ],
          },
        ],
      };
      const reportMessage = {
        slackBody: {
          messageBody: message,
          webhookUri: webhookUri,
        },
        group: targetType,
        id: reportId,
      };
      const reportNotification = await reportConsumer(reportMessage);
      if (reportNotification.statusCode === 200) {
        console.log(JSON.parse(reportNotification.body));
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
