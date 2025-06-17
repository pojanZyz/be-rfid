import { Model, DataTypes } from 'sequelize';
export default (sequelize) => {
  class Trolley extends Model {
    static associate(models) {
      Trolley.belongsTo(models.TrolleyStatus, { foreignKey: 'status_id', as: 'status' });
      Trolley.belongsTo(models.Location, { foreignKey: 'current_location_id', as: 'location' });
    }
  }
  Trolley.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rfid_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    trolley_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status_id: {
      type: DataTypes.UUID,
      references: { model: 'trolley_statuses', key: 'id' }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    current_location_id: {
      type: DataTypes.UUID,
      references: { model: 'locations', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'Trolley',
    tableName: 'trolleys',
    timestamps: false
  });
  return Trolley;
};
