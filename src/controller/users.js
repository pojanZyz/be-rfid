import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';
const { User, UserToken } = db;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret';

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: false, message: 'Username atau password salah' });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ status: false, message: 'Username atau password salah' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ status: false, message: 'Username atau password salah' });
    }
    // Generate tokens
    const access_token = jwt.sign({ id: user.id, username: user.username, role_id: user.role_id }, JWT_SECRET, { expiresIn: '24h' });
    const refresh_token = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    // Update is_logged_in
    await user.update({ is_logged_in: true, last_login: new Date() });
    // Store refresh_token in user_tokens
    await UserToken.upsert({ user_id: user.id, refresh_token, created_at: new Date(), revoked: false });
    return res.json({
      status: true,
      message: 'Success',
      data: {
        access_token,
        refresh_token
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  const { username, password, fullName, email, role } = req.body;
  let errors = {};
  if (!username) errors.username = 'Username wajib diisi';
  if (!password) errors.password = 'Password wajib diisi';
  if (!fullName) errors.fullName = 'Full name wajib diisi';
  if (!email) errors.email = 'Email wajib diisi';
  if (!role) errors.role = 'Role wajib diisi';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ status: false, message: 'Validasi gagal', errors });
  }
  try {
    const existUser = await User.findOne({ where: { username } });
    if (existUser) errors.username = 'Username sudah digunakan';
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) errors.email = 'Email tidak valid atau sudah terdaftar';
    // Lookup role by name
    const Role = db.Role;
    const foundRole = await Role.findOne({ where: { name: role } });
    if (!foundRole) errors.role = 'Role tidak ditemukan';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ status: false, message: 'Validasi gagal', errors });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      fullname: fullName,
      email,
      role_id: foundRole.id,
      is_logged_in: false
    });
    return res.json({
      status: true,
      message: 'Success',
      data: {
        userId: newUser.id,
        username: newUser.username,
        fullName: newUser.fullname,
        email: newUser.email,
        role: foundRole.name
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ status: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
  try {
    const token = await UserToken.findOne({ where: { refresh_token, revoked: false } });
    if (!token) {
      return res.status(400).json({ status: false, message: 'Token tidak valid atau sudah kadaluarsa' });
    }
    await token.update({ revoked: true });
    return res.json({ status: true, message: 'Logout berhasil' });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const refresh = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ status: false, message: 'Refresh token tidak valid atau telah dicabut' });
  }
  try {
    const token = await UserToken.findOne({ where: { refresh_token, revoked: false } });
    if (!token) {
      return res.status(400).json({ status: false, message: 'Refresh token tidak valid atau telah dicabut' });
    }
    const payload = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(400).json({ status: false, message: 'Refresh token tidak valid atau telah dicabut' });
    }
    const new_access_token = jwt.sign({ id: user.id, username: user.username, role_id: user.role_id }, JWT_SECRET, { expiresIn: '24h' });
    const new_refresh_token = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await token.update({ refresh_token: new_refresh_token, created_at: new Date() });
    return res.json({
      status: true,
      message: 'Success',
      data: {
        access_token: new_access_token,
        refresh_token: new_refresh_token
      }
    });
  } catch (err) {
    return res.status(400).json({ status: false, message: 'Refresh token tidak valid atau telah dicabut' });
  }
};

const logoutAll = async (req, res) => {
  // Bearer token required
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: false, message: 'Token tidak valid atau tidak terautentikasi' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    await UserToken.update({ revoked: true }, { where: { user_id: payload.id, revoked: false } });
    await User.update({ is_logged_in: false }, { where: { id: payload.id } });
    return res.json({ status: true, message: 'Logout semua perangkat berhasil' });
  } catch (err) {
    return res.status(401).json({ status: false, message: 'Token tidak valid atau tidak terautentikasi' });
  }
};

export default {
    login,
    register,
    logout,
    refresh,
    logoutAll
}