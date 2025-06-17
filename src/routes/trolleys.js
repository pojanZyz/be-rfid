import express from 'express';
import {
  createTrolley,
  getTrolleys,
  getTrolleyById,
  updateTrolley,
  deleteTrolley,
  getTrolleyLogs,
  getTrolleyLocationByRfid
} from '../controller/trolleys.js';
import isAdmin from '../middleware/isAdmin.js';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

// GET /trolleys - Ambil semua troli (dengan filter, pencarian, pagination, dan info lokasi)
router.get('/', isAuth, getTrolleys);
// POST /trolleys - Membuat troli baru (dengan autentikasi Bearer Token)
router.post('/', isAuth, isAdmin, createTrolley);
// GET /trolleys/:id - Mengambil detail troli berdasarkan ID
router.get('/:id', isAuth, getTrolleyById);
// PUT /trolleys/:id - Mengupdate troli berdasarkan ID (hanya untuk admin)
router.put('/:id', isAuth, isAdmin, updateTrolley);
// DELETE /trolleys/:id - Menghapus troli berdasarkan ID (hanya untuk admin)
router.delete('/:id', isAuth, isAdmin, deleteTrolley);
// GET /trolleys/:id/logs - Mengambil riwayat (logs) troli berdasarkan ID
router.get('/:id/logs', isAuth, getTrolleyLogs);
// GET /trolleys/location/:rfid - Mengambil informasi lokasi troli berdasarkan RFID
router.get('/location/:rfid', isAuth, getTrolleyLocationByRfid);

export default router;
