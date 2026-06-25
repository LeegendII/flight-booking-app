const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flights');

// Flight routes
router.get('/airports', flightsController.getAirports);
router.get('/airlines', flightsController.getAirlines);
router.get('/search', flightsController.searchFlights);
router.get('/:id/seats', flightsController.getFlightSeats);

module.exports = router;
