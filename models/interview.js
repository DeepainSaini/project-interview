'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Interview extends Model {
        static associate(models) {
            Interview.belongsTo(models.Project, {
                foreignKey: 'projectId'
            });

            Interview.belongsTo(models.SummaryVersion, {
                foreignKey: 'summaryVersionId'
            });

            Interview.hasMany(models.InterviewQuestion, {
                foreignKey: 'interviewId'
            });
        }
    }

    Interview.init(
        {
            projectId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            summaryVersionId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            summaryContent: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            status: {
                type: DataTypes.ENUM('in_progress', 'completed'),
                allowNull: false,
                defaultValue: 'in_progress'
            }
        },
        {
            sequelize,
            modelName: 'Interview',
            tableName: 'Interviews'
        }
    );

    return Interview;
};