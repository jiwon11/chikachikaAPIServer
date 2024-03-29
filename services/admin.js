const db = require("../utils/models");
const pushFcm = require("./notificationTaskWorker").pushFcm;

module.exports.verifyBills = async function verifyBills(event) {
  try {
    console.log(event.queryStringParameters);
    const purpose = event.pathParameters.purpose;
    const reviewId = event.queryStringParameters.reviewId;
    const review = await db.Review.findOne({
      where: {
        id: reviewId,
      },
      include: [
        {
          model: db.User,
          attributes: ["id", "nickname", "fcmToken"],
        },
        {
          model: db.Dental_clinic,
        },
      ],
    });
    var message;
    console.log(JSON.stringify(review.user));
    if (purpose === "permission") {
      if (review.certifiedBill !== true) {
        await review.update({
          certifiedBill: true,
        });
        message = {
          notification: {
            title: "영수증 검수가 완료되었습니다.",
            body: "영수증 검수 결과, 리뷰의 영수증 인증이 확인되었습니다.",
          },
          data: { targetId: `${review.id}` },
          token: review.user.fcmToken,
        };
      }
    } else {
      if (review.certifiedBill !== false) {
        await review.update({
          certifiedBill: false,
        });
        message = {
          notification: {
            title: "영수증 검수가 완료되었습니다.",
            body: "영수증 검수 결과, 반려되어 리뷰의 영수증 인증이 보류되었습니다.",
          },
          data: { targetId: `${review.id}` },
          token: review.user.fcmToken,
        };
      }
    }
    const userNotifyConfig = await db.NotificationConfig.findOne({
      where: {
        userId: review.user.id,
      },
    });
    if (userNotifyConfig.event === true) {
      const fcmResponse = await pushFcm(message);
      console.log(fcmResponse);
    }
    return {
      statusCode: 200,
      body: `{ status: "OK" }`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
