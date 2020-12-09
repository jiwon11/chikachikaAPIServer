const jwt = require("jsonwebtoken");
const { User } = require("../../utils/models");

exports.getUserInToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: {
        id: decoded.id,
      },
    });
    if (user) {
      req.user = user;
      next();
    } else {
      res
        .status(401)
        .json({
          message: "Can't find User",
        })
        .end();
    }
  } else {
    res
      .status(401)
      .json({
        message: "Can't find Token",
      })
      .end();
  }
};
