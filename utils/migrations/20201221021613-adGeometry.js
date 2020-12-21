"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("cities", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sido: {
        type: Sequelize.CHAR,
        allowNull: false,
      },
      sigungu: {
        type: Sequelize.CHAR,
        allowNull: false,
      },
      adCity: {
        type: Sequelize.CHAR,
        allowNull: false,
      },
      legalCity: {
        type: Sequelize.CHAR,
        allowNull: false,
      },
      emdCode: {
        type: Sequelize.CHAR,
        allowNull: false,
      },
      emdName: {
        type: Sequelize.CHAR,
        allowNull: false,
      },
      geometry: {
        type: Sequelize.GEOMETRY("POLYGON"),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
