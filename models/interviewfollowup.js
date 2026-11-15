'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class InterviewFollowUp extends Model {
        static associate(models) {
            InterviewFollowUp.belongsTo(models.InterviewQuestion, {
                foreignKey: 'interviewQuestionId'
            });

            InterviewFollowUp.belongsTo(models.AnswerAttempt, {
                foreignKey: 'answerAttemptId'
            });
        }
    }

    InterviewFollowUp.init(
        {
            interviewQuestionId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true
            },

            answerAttemptId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            questionText: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            answerText: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    notEmpty: true
                }
            },

            feedback: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            status: {
                type: DataTypes.ENUM('pending', 'answered', 'skipped'),
                allowNull: false,
                defaultValue: 'pending'
            },

            feedbackStatus: {
                type: DataTypes.ENUM('pending', 'completed', 'failed'),
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'InterviewFollowUp',
            tableName: 'InterviewFollowUps'
        }
    );

    return InterviewFollowUp;
};