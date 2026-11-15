'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Match the table format expected by express-mysql-session.
    await queryInterface.createTable('sessions', {
      session_id: {
        type: Sequelize.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      expires: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      data: {
        type: Sequelize.TEXT('medium'),
        allowNull: true,
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_bin',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sessions');
  }
};
