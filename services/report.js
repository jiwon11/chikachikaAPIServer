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
      if (bodyImages.length > 0) {
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
          statusCode: 400,
          body: `{"statusText": "Bad Request","message": "관련 사진은 반드시 1개 이상 있어야 합니다."}`,
        };
      }
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
