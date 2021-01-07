module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "dentalClinicProfileImg",
    {
      img_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      img_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      img_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
