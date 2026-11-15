'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('InterviewFollowUps', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            interviewQuestionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'InterviewQuestions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            answerAttemptId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'AnswerAttempts',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            questionText: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            answerText: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            feedback: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            status: {
                type: Sequelize.ENUM('pending', 'answered', 'skipped'),
                allowNull: false,
                defaultValue: 'pending'
            },

            feedbackStatus: {
                type: Sequelize.ENUM('pending', 'completed', 'failed'),
                allowNull: true
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
        await queryInterface.dropTable('InterviewFollowUps');
    }
};