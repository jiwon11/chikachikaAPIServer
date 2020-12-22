module.exports = (sequelize, DataTypes) =>
  sequelize.define("cities", {
    sido: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    sigungu: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    adCity: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    legalCity: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    emdCode: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    emdName: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    geometry: {
      type: DataTypes.GEOMETRY("POLYGON"),
      allowNull: false,
    },
  });
