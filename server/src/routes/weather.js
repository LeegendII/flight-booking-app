const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather');

// Weather check endpoint
router.get('/', weatherController.getDestinationWeather);

module.exports = router;
