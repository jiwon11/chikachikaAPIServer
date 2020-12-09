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
      await queryInterface.addColumn(
        "Community_syptom",
        "index",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Community_treatment",
        "index",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Community_dental_clinic",
        "index",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );
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
      await queryInterface.removeColumn("Community_syptom", "index", { transaction });
      await queryInterface.removeColumn("Community_treatment", "index", { transaction });
      await queryInterface.removeColumn("Community_dental_clinic", "index", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
