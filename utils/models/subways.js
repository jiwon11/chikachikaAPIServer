module.exports = (sequelize, DataTypes) => {
  const subway = sequelize.define(
    "subways",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lineName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      geographLat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      geographLong: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      paranoid: false,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
  return subway;
};
