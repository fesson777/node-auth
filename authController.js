const User = require('./models/User')
const Role = require('./models/Role')
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { secret } = require('./config')

function generateAccessToken(id, roles) {
  const payload = {
    id,
    roles,
  }
  return jwt.sign(payload, secret, { expiresIn: '24h' })
}

class authController {
  async registration(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Ошибка регистрации', errors })
      }

      const { username, password } = req.body
      const candidate = await User.findOne({ username })
      if (candidate) {
        res
          .status(400)
          .json({ message: 'Такой логин уже существует, придумайте новый!' })
      }
      const hashPassword = bcrypt.hashSync(password, 7)
      const userRole = await Role.findOne({ value: 'USER' })
      const user = new User({
        username,
        password: hashPassword,
        roles: [userRole.value],
      })
      await user.save()
      return res.json({ message: 'Регистрация прошла успешно!' })
    } catch (e) {
      console.log(e)
      res.status(400).json({ message: 'registration error' })
    }
  }
  async login(req, res) {
    try {
      const { username, password } = req.body
      const user = await User.findOne({ username })
      if (!user) {
        return res
          .status(400)
          .json({ message: `Пользователь ${username} не найден` })
      }
      const validPassword = bcrypt.compareSync(password, user.password)
      if (!validPassword) {
        return res.status(400).json({ message: `Введён не верный пароль` })
      }
      const token = generateAccessToken(user._id, user.roles)
      return res.json({ token })
    } catch (e) {
      console.log(e)
      res.status(400).json({ message: 'login error' })
    }
  }
  async getUsers(req, res) {
    try {
      const users = await User.find()

      res.json(users.map(({ username }) => username))
    } catch (e) {
      console.log(e)
    }
  }
  async deleteUser(req, res) {
    try {
      const { name } = req.body
      const user = await User.findOne({ username: name })
      if (!user) {
        return res
          .status(400)
          .json({ message: `Пользователь для удаления не найден!` })
      }
      await User.deleteOne({ _id: user._id })

      res.json(user)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = new authController()
