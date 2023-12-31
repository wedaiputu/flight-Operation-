'use strict';
const bcrypt = require('bcrypt')
const { Op } = require('sequelize')

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasOne(models.UserProfile)
    }

    static async add(input, profileModel) {
      const userCreated = await User.create({
        email: input.email,
        password: input.password
      })
    }

    static async login(req) {
      let input = req.body
      const account = await User.findOne({
        attributes: [
          "id",
          "role",
          "email",
          "password",
        ],
        where: {
          email: input.email
        }
      })

      req.session.role = account.role

      if(account) {
        const isValidPassword = bcrypt.compareSync(input.password, account.password)
        if(isValidPassword) {
          return account.id
        }
      }

      throw new Error('Invalid password or username.')
    }
  }
  User.init({
    role: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          args: true,
          msg: "Email is required."
        },
        notEmpty: {
          args: true,
          msg: "Email is required."
        },
        isEmail: {
          args: true,
          msg: "Email is not valid."
        },
        async notSame(value) {
          const emailUser = await User.findOne({
            attributes: [
              "email"
            ],
            where: {
              email: {
                [Op.like]: value
              }
            }
          })
          
          if(emailUser) {
            throw new Error('Email already use.')
          }
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          args: true,
          msg: "Password is required."
        },
        notEmpty: {
          args: true,
          msg: "Password is required."
        },
        len: {
          args: [8],
          msg: "Password need at least 8 characters."
        }
      }
    },
    role: DataTypes.STRING
  }, {
    hooks: {
      beforeCreate: (user, _) => {
        const salt = bcrypt.genSaltSync()
        const hash = bcrypt.hashSync(user.password, salt)

        user.role = 'pilot'
        user.email = user.email
        user.password = hash
      }
    },
    sequelize,
    modelName: 'User',
  });
  return User;
};