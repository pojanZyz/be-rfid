import express from 'express';
import usersController from '../controller/users.js';
import isAdmin from '../middleware/isAdmin.js';
import isAuth from '../middleware/isAuth.js';
const router = express.Router();
// Register
router.post('/register', usersController.register);
// Login
router.post('/login', usersController.login);
// Logout
router.post('/logout', usersController.logout);
// Refresh
router.post('/refresh', usersController.refresh);
// Logout all
router.post('/logout-all', isAuth, isAdmin, usersController.logoutAll);

export default router;
