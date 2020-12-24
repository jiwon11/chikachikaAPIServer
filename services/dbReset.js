const { sequelize } = require("../utils/models");
const { Dental_clinic } = require("../utils/models");
const { QueryTypes } = require("sequelize");

module.exports.handler = async function dbReset(event) {
  try {
    const clinicNames = await sequelize.query("SELECT name, COUNT(name) FROM dental_clinics GROUP BY name HAVING COUNT(name) >= 2;", { type: QueryTypes.SELECT });
    console.log(clinicNames);
    clinicNames.forEach(async (clinicName) => {
      const duplicateClinics = await Dental_clinic.findAll({
        where: {
          name: clinicName.name,
        },
      });
      for (const dupliClinic of duplicateClinics) {
        const name = dupliClinic.dataValues.name;
        const locals = dupliClinic.dataValues.local.split(" ");
        await Dental_clinic.update(
          {
            name: `${name}(${locals[0]}-${locals[1]})`,
          },
          {
            where: {
              id: dupliClinic.dataValues.id,
            },
          }
        );
        console.log(`updatedClinic Name: ${name}(${locals[0]}-${locals[1]})`);
      }
    });
  } catch (error) {
    console.log(error);
  }
  //const clinics = await Dental_clinic.findAll({ group: "name" });
};

/**
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZiMDYxN2IwLTMzYzAtMTFlYi05MmRlLWUzZmIzYjRlMDI2NCIsImlhdCI6MTYwNjgxODk1MCwiZXhwIjoxNjM4Mzc2NTUwfQ.3-PEUaAWAW6sjl7TuKNzSHlTlK8p7myWG8nedNZ3nFE
 */
