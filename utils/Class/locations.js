const Sequelize = require("sequelize");

module.exports.getLocations = async function (db, query, queryLen) {
  const sido = await db.Sido.findAll({
    attributes: ["name", ["fullName", "name"], [Sequelize.literal(`(IF((((SELECT SUBSTR((SELECT name),1,${queryLen}))='${query}')), TRUE, FALSE))`), "initialLetterContained"]],
    where: {
      fullName: {
        [Sequelize.Op.like]: `%${query}%`,
      },
    },
    order: Sequelize.literal("initialLetterContained DESC"),
  });
  const sigungu = await db.Sigungu.findAll({
    attributes: [
      [Sequelize.fn("CONCAT", Sequelize.col("name"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', 1))"), ")"), "name"],
      [Sequelize.literal(`(IF((((SELECT SUBSTR((SELECT name),1,${queryLen}))='${query}')), TRUE, FALSE))`), "initialLetterContained"],
    ],
    where: {
      [Sequelize.Op.or]: [
        Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("name"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', 1))"), ")"), {
          [Sequelize.Op.like]: `%${query}%`,
        }),
        {
          fullName: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
      ],
    },
    limit: 5,
    order: Sequelize.literal("initialLetterContained DESC"),
  });
  const cities = await db.City.findAll({
    where: {
      [Sequelize.Op.or]: [
        Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
          [Sequelize.Op.like]: `%${query}%`,
        }),
        Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("emdName"), "(", Sequelize.col("sigungu"), ")"), {
          [Sequelize.Op.like]: `%${query}%`,
        }),
      ],
    },
    attributes: [
      [Sequelize.literal("CONCAT(emdName, '(',(SELECT SUBSTRING_INDEX(sigungu, ' ', 1)),')')"), "name"],
      [Sequelize.literal(`(IF((((SELECT SUBSTR((SELECT name),1,${queryLen}))='${query}')), TRUE, FALSE))`), "initialLetterContained"],
    ],
    group: Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")),
    order: Sequelize.literal("initialLetterContained DESC"),
    limit: 5,
  });
  const locations = cities.concat(sido, sigungu);
  locations.forEach((location) => location.setDataValue("category", "city"));
  return locations;
};
