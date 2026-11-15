'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectSourceVersion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProjectSourceVersion.belongsTo(models.Project, {
        foreignKey: 'projectId',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
  }
  ProjectSourceVersion.init({
     projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sourceType: {
      type: DataTypes.ENUM('notes', 'readme'),
      allowNull: false,
      validate: {
        isIn: [['notes', 'readme']],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }, {
    sequelize,
    modelName: 'ProjectSourceVersion',
  });
  return ProjectSourceVersion;
};