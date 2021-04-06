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
      await queryInterface.removeColumn("reviews", "starRate_cost", { transaction });
      await queryInterface.removeColumn("reviews", "starRate_treatment", { transaction });
      await queryInterface.removeColumn("reviews", "starRate_service", { transaction });
      await queryInterface.addColumn("reviews", "recommend", { type: Sequelize.BOOLEAN, allowNull: false }, { transaction });
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
  },
};
