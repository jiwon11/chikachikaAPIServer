module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "dental_clinic",
    {
      name: {
        type: DataTypes.STRING(300),
        allowNull: false,
        unique: true,
      },
      local: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      telNumber: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      launchDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      geographLong: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      geographLat: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      CD_Num: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      SD_Num: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      RE_Num: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      IN_Num: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      Mon_Consulation_start_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Mon_Consulation_end_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Tus_Consulation_start_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Tus_Consulation_end_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Wed_Consulation_start_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Wed_Consulation_end_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Thu_Consulation_start_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Thu_Consulation_end_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Fri_Consulation_start_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Fri_Consulation_end_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Sat_Consulation_start_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      Sat_Consulation_end_time: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      weekday_TOR: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      Sat_TOR: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      weekday_TOL_start: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      weekday_TOL_end: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      weekday_TOL_notice: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      sat_TOL_start: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      sat_TOL_end: {
        type: DataTypes.TIME,
        allowNullL: true,
      },
      sat_TOL_notice: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      weekend_non_consulation_notice: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      parking_allow_num: {
        type: DataTypes.INTEGER,
        allowNullL: true,
      },
      parking_cost: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      parking_others_notice: {
        type: DataTypes.STRING,
        allowNullL: true,
      },
      closed: {
        type: DataTypes.BOOLEAN,
        defaltValue: false,
        allowNullL: false,
      },
      holiday_treatment: {
        type: DataTypes.BOOLEAN,
        allowNullL: false,
      },
      weekend_treatment: {
        type: DataTypes.BOOLEAN,
        allowNullL: true,
      },
      ykiho: {
        type: DataTypes.STRING,
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
