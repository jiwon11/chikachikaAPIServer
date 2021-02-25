module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "search_record",
    {
      searchQuery: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      inputQuery: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      route: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
