const express = require('express');
const router = express.Router();
const id = require('../middlewares/id');
const asyncHandler = require('../utils/asyncHandler');
const reservationController = require('../controllers/reservations.controllers');

router.get('/', asyncHandler(reservationController.getAllReservations));
router.post('/', asyncHandler(reservationController.createReservation));

module.exports = router;