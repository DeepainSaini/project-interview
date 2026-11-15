'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('InterviewQuestions', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            interviewId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Interviews',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            questionText: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            position: {
                type: Sequelize.INTEGER,
                allowNull: false
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

        await queryInterface.addConstraint('InterviewQuestions', {
            fields: ['interviewId', 'position'],
            type: 'unique',
            name: 'interview_questions_unique_position'
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('InterviewQuestions');
    }
};