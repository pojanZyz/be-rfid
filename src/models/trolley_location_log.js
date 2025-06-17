import { Model, DataTypes } from 'sequelize';
export default (sequelize) => {
  class TrolleyLocationLog extends Model {
    static associate(models) {
      TrolleyLocationLog.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' });
      TrolleyLocationLog.belongsTo(models.User, { foreignKey: 'detected_by', as: 'detectedBy' });
    }
  }
  TrolleyLocationLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trolley_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'trolleys', key: 'id' }
    },
    location_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'locations', key: 'id' }
    },
    detected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    detected_by: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'id' }
    },
    x_offset: DataTypes.DECIMAL,
    y_offset: DataTypes.DECIMAL,
    z_offset: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'TrolleyLocationLog',
    tableName: 'trolley_location_logs',
    timestamps: false
  });
  return TrolleyLocationLog;
};
