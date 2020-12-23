const jwt = require("jsonwebtoken");
const { User, Review, Community } = require("../utils/models");

module.exports.addScrapReview = async function addScrapReview(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const reviewId = event.queryStringParameters.reviewId;
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
    });
    if (review) {
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });
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
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const reviewId = event.queryStringParameters.reviewId;
    const review = await Review.findOne({
      where: {
        id: reviewId,
      },
    });
    if (review) {
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });
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
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const postId = event.queryStringParameters.postId;
    const post = await Community.findOne({
      where: {
        id: postId,
      },
    });
    if (post) {
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });
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
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const postId = event.queryStringParameters.postId;
    const post = await Community.findOne({
      where: {
        id: postId,
      },
    });
    if (post) {
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });
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
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
