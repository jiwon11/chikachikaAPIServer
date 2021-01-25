const jwt = require("jsonwebtoken");
const { User, Review, Community, Sequelize } = require("../utils/models");

module.exports.addLikeReview = async function addLikeReview(event) {
  try {
    const user = event.requestContext.authorizer;
    console.log(user);
    if (user) {
      const userId = user.id;
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
        const user = await User.findOne({
          where: {
            id: userId,
          },
        });
        await user.addLikeReview(review);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "리뷰에 좋아요를 추가하였습니다."}`,
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

module.exports.removeLikeReview = async function removeLikeReview(event) {
  try {
    const user = event.requestContext.authorizer;
    console.log(user);
    if (user) {
      const userId = user.id;
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
        await user.removeLikeReview(review);
        return {
          statusCode: 204,
          body: `{"statusText": "OK","message": "리뷰에 좋아요를 취소하였습니다."}`,
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

module.exports.addLikeCommunity = async function addLikeCommunity(event) {
  try {
    const user = event.requestContext.authorizer;
    const postId = event.queryStringParameters.postId;
    console.log(user);
    if (user) {
      console.log(user instanceof User);
      const post = await Community.findOne({
        where: {
          id: postId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
      });
      if (post) {
        await user.addLikeCommunities(post);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "수다방 글에 좋아요를 추가하였습니다."}`,
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

module.exports.removeLikeCommunity = async function removeLikeCommunity(event) {
  try {
    const user = event.requestContext.authorizer;
    console.log(user);
    if (user) {
      const userId = user.id;
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
        await user.removeLikeCommunities(post);
        return {
          statusCode: 200,
          body: `{"statusText": "OK","message": "수다방 글에 좋아요를 취소하였습니다."}`,
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
