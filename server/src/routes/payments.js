const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments');
const { authenticateToken } = require('../middleware/auth');

// Protected payment routes
router.post('/stripe/intent', authenticateToken, paymentsController.createStripePaymentIntent);
router.post('/paypal/execute', authenticateToken, paymentsController.executePayPalPayment);
router.post('/flutterwave/charge', authenticateToken, paymentsController.createFlutterwaveCharge);
router.get('/booking/:bookingId', authenticateToken, paymentsController.getPaymentByBooking);

module.exports = router;
