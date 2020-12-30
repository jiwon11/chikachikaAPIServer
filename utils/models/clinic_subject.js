module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Clinic_subject",
    {
      SpecialistDentist_NUM: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      choiceTreatmentDentist_NUM: {
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
