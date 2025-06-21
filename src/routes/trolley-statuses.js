import express from 'express';
import {
  getTrolleyStatuses,
  createTrolleyStatus,
  updateTrolleyStatus,
  deleteTrolleyStatus
} from '../controller/trolley-statuses.js';
import auth from '../middleware/isAuth.js';
import admin from '../middleware/isAdmin.js';

const router = express.Router();

// Semua endpoint require auth
router.get('/', auth, getTrolleyStatuses);
router.post('/', auth, admin, createTrolleyStatus);
router.put('/:id', auth, admin, updateTrolleyStatus);
router.delete('/:id', auth, admin, deleteTrolleyStatus);

export default router;
