'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('AnswerAttempts', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            interviewQuestionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'InterviewQuestions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            answerText: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            feedback: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            feedbackStatus: {
                type: Sequelize.ENUM('pending', 'completed', 'failed'),
                allowNull: false,
                defaultValue: 'pending'
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
        await queryInterface.dropTable('AnswerAttempts');
    }
};