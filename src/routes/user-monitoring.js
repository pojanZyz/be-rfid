import express from 'express';
import { getUserMonitoring } from '../controller/user-monitoring.js';
import isAuth from '../middleware/isAuth.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

router.get('/users/monitoring', isAuth, isAdmin, getUserMonitoring);

export default router;
