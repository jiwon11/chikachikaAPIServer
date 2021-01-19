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
        "community_imgs",
        "img_width",
        {
          type: Sequelize.INTEGER(11),
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "community_imgs",
        "img_height",
        {
          type: Sequelize.INTEGER(11),
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "review_contents",
        "img_width",
        {
          type: Sequelize.INTEGER(11),
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "review_contents",
        "img_height",
        {
          type: Sequelize.INTEGER(11),
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
  },
};
