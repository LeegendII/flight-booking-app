const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Saved passengers routes
router.get('/passengers', authenticateToken, authController.getSavedPassengers);
router.post('/passengers', authenticateToken, authController.addSavedPassenger);
router.delete('/passengers/:id', authenticateToken, authController.deleteSavedPassenger);

module.exports = router;
