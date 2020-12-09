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
        "notifications",
        "senderId",
        {
          type: Sequelize.CHAR,
          references: {
            model: "users",
            key: "id",
          },
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "notifications",
        "notificatedUserId",
        {
          type: Sequelize.CHAR,
          references: {
            model: "users",
            key: "id",
          },
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "notifications",
        "reviewId",
        {
          type: Sequelize.INTEGER,
          references: {
            model: "reviews",
            key: "id",
          },
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "notifications",
        "reviewCommentId",
        {
          type: Sequelize.INTEGER,
          references: {
            model: "review_comments",
            key: "id",
          },
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "notifications",
        "communityCommentId",
        {
          type: Sequelize.INTEGER,
          references: {
            model: "community_comments",
            key: "id",
          },
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
      await queryInterface.removeColumn("notifications", "senderId", { transaction });
      await queryInterface.removeColumn("notifications", "notificatedUserId", { transaction });
      await queryInterface.removeColumn("notifications", "reviewId", { transaction });
      await queryInterface.removeColumn("notifications", "reviewCommentId", { transaction });
      await queryInterface.removeColumn("notifications", "communityCommentId", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
