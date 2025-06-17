import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class User extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fullname: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    role_id: {
      type: DataTypes.UUID,
      references: { model: 'roles', key: 'id' }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    is_logged_in: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_login: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false
  });
  return User;
};
