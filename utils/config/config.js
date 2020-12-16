const development = {
  database: "chikachika_db_dev",
  port: null,
  host: "database-1.c2g4zseshvri.ap-northeast-2.rds.amazonaws.com",
  username: "admin",
  password: "jeewon0109!",
  dialect: "mysql",
  logging: false,
  timezone: "+09:00",
  pool: {
    max: 20,
    min: 5,
    idle: 60000,
  },
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
};
const test = {
  username: "admin",
  password: "jeewon0109!",
  database: "chikachika_db_test",
  host: "database-1.c2g4zseshvri.ap-northeast-2.rds.amazonaws.com",
  port: 3306,
  dialect: "mysql",
  logging: false,
  charset: "utf8",
  collate: "utf8_general_ci",
};
const production = {
  database: "chikachika_db_prod",
  port: 3306,
  /*
  replication: {
    read: [
      {
        host: process.env.RDS_SLAVE1_HOST,
        username: process.env.USERNAME,
        password: process.env.RDS_SLAVE1_PASSWORD,
      },
      {
        host: process.env.RDS_SLAVE2_HOST,
        username: process.env.USERNAME,
        password: process.env.RDS_SLAVE2_PASSWORD,
      },
    ],
    write: {
      host: process.env.RDS_MASTER_HOST,
      username: process.env.USERNAME,
      password: process.env.RDS_MASTER_PASSWORD,
    },
  },
  */
  host: "database-1.c2g4zseshvri.ap-northeast-2.rds.amazonaws.com",
  username: "admin",
  password: "jeewon0109!",
  dialect: "mysql",
  logging: false,
  timezone: "+09:00",
  pool: {
    max: 20,
    min: 5,
    idle: 60000,
  },
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
};

module.exports = {
  development,
  production,
  test,
};
