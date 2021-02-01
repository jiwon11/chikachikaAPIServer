const Sequelize = require("sequelize");
const cityAttributes = [
  "id",
  "sido",
  "sigungu",
  "emdName",
  "legalCity",
  "relativeAddress",
  "fullCityName",
  [Sequelize.literal("(SELECT COUNT(*) FROM dental_clinics WHERE dental_clinics.cityId = cities.id)"), "clinicsNum"],
];

module.exports.searchAll = async function (type, query, currentCity, offset, limit) {
  var whereQuery;
  if (type === "keyword") {
    whereQuery = {
      [Sequelize.Op.or]: [
        Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
          [Sequelize.Op.like]: `%${query}%`,
        }),
        {
          relativeAddress: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
      ],
    };
  } else if (type === "intersect") {
    whereQuery = Sequelize.literal(`MBRIntersects(geometry, ST_GeomFromGeoJSON('${JSON.stringify(currentCity.geometry)}',2,0)) AND cities.id != ${currentCity.id}`);
  }
  return await this.findAll({
    attributes: cityAttributes,
    offset: offset,
    limit: limit,
    where: whereQuery,
    raw: true,
  });
};

module.exports.current = async function (long, lat) {
  const currentCityAttributes = cityAttributes.slice();
  currentCityAttributes.push("geometry");
  return await this.findOne({
    attributes: currentCityAttributes,
    where: Sequelize.literal(`MBRContains(geometry,ST_GeomFromText("point(${long} ${lat})"))`),
    raw: true,
  });
};
