'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AnswerAttempt extends Model {
        static associate(models) {
            AnswerAttempt.belongsTo(models.InterviewQuestion, {
                foreignKey: 'interviewQuestionId'
            });

            AnswerAttempt.hasOne(models.InterviewFollowUp, {
                foreignKey: 'answerAttemptId'
            });
        }
    }

    AnswerAttempt.init(
        {
            interviewQuestionId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            answerText: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            feedback: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            feedbackStatus: {
                type: DataTypes.ENUM('pending', 'completed', 'failed'),
                allowNull: false,
                defaultValue: 'pending'
            }
        },
        {
            sequelize,
            modelName: 'AnswerAttempt',
            tableName: 'AnswerAttempts'
        }
    );

    return AnswerAttempt;
};