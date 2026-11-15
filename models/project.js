'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.User, {
        foreignKey: 'userId',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });

      Project.hasMany(models.ProjectSourceVersion, {
        foreignKey: 'projectId',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });

      Project.hasMany(models.SummaryVersion, {
        foreignKey: 'projectId',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
  }

  Project.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Project',
  });

  return Project;
};