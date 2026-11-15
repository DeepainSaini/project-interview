'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SummaryVersion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       SummaryVersion.belongsTo(models.Project, {
        foreignKey: 'projectId',
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
  }
  SummaryVersion.init({
     projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sourceVersionIds: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'approved'),
      allowNull: false,
      defaultValue: 'draft',
    },
  }, {
    sequelize,
    modelName: 'SummaryVersion',
  });
  return SummaryVersion;
};