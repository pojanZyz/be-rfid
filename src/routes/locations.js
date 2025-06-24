import express from 'express';
import { getLocations } from '../controller/location.js';
import { addLocation, updateLocation, deleteLocation } from '../controller/location-manage.js';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

router.get('/', isAuth, getLocations);
router.post('/add', isAuth, addLocation);
router.put('/update/:id', isAuth, updateLocation);
router.delete('/delete/:id', isAuth, deleteLocation);

export default router;
