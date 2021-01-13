const cityQueryClass = require("../Class/city");
module.exports = (sequelize, DataTypes) => {
  const city = sequelize.define("cities", {
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
      type: DataTypes.GEOMETRY,
      allowNull: false,
    },
    relativeAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  city.searchAll = cityQueryClass.searchAll;
  city.current = cityQueryClass.current;
  return city;
};
