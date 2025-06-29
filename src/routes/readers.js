import express from 'express';
import { getRFIDReaders, updateRFIDReader } from '../controller/rfid-readers.js';
import isAuth from '../middleware/isAuth.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

// GET /readers
router.get('/', isAuth, isAdmin, getRFIDReaders);

// PATCH /readers/:id
router.patch('/:id', isAuth, isAdmin, updateRFIDReader);

export default router;
