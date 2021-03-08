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
      await queryInterface.createTable("review_disease_items", {
        index: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        reviewId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "reviews",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        diseaseItemId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "disease_items",
            key: "id",
          },
          onDelete: "CASCADE",
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
      await queryInterface.createTable("community_diseases", {
        index: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        communityId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "communities",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        diseaseItemId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "disease_items",
            key: "id",
          },
          onDelete: "CASCADE",
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
