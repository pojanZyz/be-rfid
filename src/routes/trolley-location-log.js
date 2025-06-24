import express from 'express';
import { postTrolleyLocationLog } from '../controller/trolley-location-log.js';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

router.post('/trolleys/:id/location-logs', isAuth, postTrolleyLocationLog);

export default router;
