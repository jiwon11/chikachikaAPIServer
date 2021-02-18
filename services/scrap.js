const jwt = require("jsonwebtoken");
const { User, Review, Community, Dental_clinic, Sequelize, DentalClinicProfileImg } = require("../utils/models");

module.exports.addScrapReview = async function addScrapReview(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const reviewId = event.queryStringParameters.reviewId;
      const review = await Review.findOne({
        where: {
          id: reviewId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
      });
      if (review) {
        await user.addScrapReviews(review);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "리뷰를 스크랩하였습니다."}`,
        };
      } else {
        return {
          statusCode: 404,
          body: `{"statusText": "Not Found","message": "요청한 리뷰를 찾을 수 없습니다."}`,
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

module.exports.removeScrapReview = async function removeScrapReview(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const reviewId = event.queryStringParameters.reviewId;
      const review = await Review.findOne({
        where: {
          id: reviewId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
      });
      if (review) {
        await user.removeScrapReviews(review);
        return {
          statusCode: 204,
          body: `{"statusText": "No Content","message": "리뷰를 스크랩 취소하였습니다."}`,
        };
      } else {
        return {
          statusCode: 404,
          body: `{"statusText": "Not Found","message": "요청한 리뷰를 찾을 수 없습니다."}`,
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

module.exports.addScrapCommunities = async function addScrapCommunities(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    console.log(user);
    if (user) {
      const postId = event.queryStringParameters.postId;
      const post = await Community.findOne({
        where: {
          id: postId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
      });
      if (post) {
        await user.addScrapCommunities(post);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "수다방 글을 스크랩하였습니다."}`,
        };
      } else {
        return {
          statusCode: 404,
          body: `{"statusText": "Not Found","message": "요청한 수다방 글을 찾을 수 없습니다."}`,
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

module.exports.removeScrapCommunities = async function removeScrapCommunities(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const postId = event.queryStringParameters.postId;
      const post = await Community.findOne({
        where: {
          id: postId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
      });
      if (post) {
        await user.removeScrapCommunities(post);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "수다방 글을 스크랩 취소하였습니다."}`,
        };
      } else {
        return {
          statusCode: 404,
          body: `{"statusText": "Not Found","message": "요청한 수다방 글을 찾을 수 없습니다."}`,
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

module.exports.addScrapClinic = async function addScrapClinic(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const clinicId = event.queryStringParameters.clinicId;
      const clinic = await Dental_clinic.findOne({
        where: {
          id: clinicId,
        },
      });
      if (clinic) {
        await user.addScrapClinics(clinic);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "치과병원을 스크랩하였습니다."}`,
        };
      } else {
        return {
          statusCode: 404,
          body: `{"statusText": "Not Found","message": "요청한 병원을 찾을 수 없습니다."}`,
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

module.exports.removeScrapClinic = async function removeScrapClinic(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const clinicId = event.queryStringParameters.clinicId;
      const clinic = await Dental_clinic.findOne({
        where: {
          id: clinicId,
        },
      });
      if (clinic) {
        await user.removeScrapClinics(clinic);
        return {
          statusCode: 204,
          body: `{"statusText": "No Content","message": "치과병원을 스크랩 취소하였습니다."}`,
        };
      } else {
        return {
          statusCode: 404,
          body: `{"statusText": "Not Found","message": "요청한 치과병원을 찾을 수 없습니다."}`,
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

module.exports.getScrapClinic = async function getScrapClinic(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const userScrapClinics = await user.getScrapClinics({
        through: {
          attributes: [],
        },
        attributes: ["id", "originalName", "local", "telNumber"],
        include: [
          {
            model: DentalClinicProfileImg,
            limit: 1,
            order: [["represent", "DESC"]],
          },
        ],
      });
      return {
        statusCode: 200,
        body: JSON.stringify(userScrapClinics),
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
