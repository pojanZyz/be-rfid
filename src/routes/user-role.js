import express from 'express';
import { updateUserRole } from '../controller/user-role.js';
import isAuth from '../middleware/isAuth.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

router.patch('/users/:id/role', isAuth, isAdmin, updateUserRole);

export default router;
