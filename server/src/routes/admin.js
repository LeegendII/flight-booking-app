const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Protected admin metrics & controls
router.get('/stats', authenticateToken, isAdmin, adminController.getDashboardStats);
router.post('/flights', authenticateToken, isAdmin, adminController.createFlight);
router.put('/flights/:id/status', authenticateToken, isAdmin, adminController.updateFlightStatus);

module.exports = router;
