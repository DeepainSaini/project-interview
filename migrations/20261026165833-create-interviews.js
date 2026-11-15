'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Interviews', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            projectId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Projects',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            summaryVersionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'SummaryVersions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            summaryContent: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            status: {
                type: Sequelize.ENUM('in_progress', 'completed'),
                allowNull: false,
                defaultValue: 'in_progress'
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Interviews');
    }
};