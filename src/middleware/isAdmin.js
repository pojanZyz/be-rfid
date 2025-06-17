import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const isAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: false, message: 'Token tidak valid atau tidak terautentikasi' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Ambil user dari DB
    const user = await db.User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ status: false, message: 'User tidak ditemukan' });
    }
    // Ambil role dari DB
    const role = await db.Role.findByPk(user.role_id);
    if (!role || role.name !== 'admin') {
      return res.status(403).json({ status: false, message: 'Akses hanya untuk admin' });
    }
    req.user = user; // inject user ke req
    next();
  } catch (err) {
    return res.status(401).json({ status: false, message: 'Token tidak valid atau tidak terautentikasi' });
  }
};

export default isAdmin;
