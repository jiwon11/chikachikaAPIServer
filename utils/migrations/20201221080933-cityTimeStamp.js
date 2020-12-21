"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("cities", "createdAt", { transaction });
      await queryInterface.removeColumn("cities", "updatedAt", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "cities",
        "createdAt",
        {
          allowNull: false,
          type: Sequelize.DATE,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "cities",
        "updatedAt",
        {
          allowNull: false,
          type: Sequelize.DATE,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "cities",
        "deletedAt",
        {
          allowNull: false,
          type: Sequelize.DATE,
        },
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
