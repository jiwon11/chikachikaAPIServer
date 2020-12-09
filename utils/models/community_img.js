module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "community_img",
    {
      img_originalname: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      img_mimetype: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      img_filename: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      img_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      img_url: {
        type: DataTypes.STRING(400),
        allowNull: false,
      },
      img_index: {
        type: DataTypes.INTEGER,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
