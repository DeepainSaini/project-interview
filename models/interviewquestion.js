'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class InterviewQuestion extends Model {
        static associate(models) {
            InterviewQuestion.belongsTo(models.Interview, {
                foreignKey: 'interviewId'
            });

            InterviewQuestion.hasMany(models.AnswerAttempt, {
                foreignKey: 'interviewQuestionId'
            });

            InterviewQuestion.hasOne(models.InterviewFollowUp, {
                foreignKey: 'interviewQuestionId'
            });
        }
    }

    InterviewQuestion.init(
        {
            interviewId: {
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

            position: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    isInt: true,
                    min: 1,
                    max: 5
                }
            },

            followUpStatus: {
                type: DataTypes.ENUM('pending', 'not_needed', 'generated'),
                allowNull: false,
                defaultValue: 'pending'
            }
        },
        {
            sequelize,
            modelName: 'InterviewQuestion',
            tableName: 'InterviewQuestions'
        }
    );

    return InterviewQuestion;
};