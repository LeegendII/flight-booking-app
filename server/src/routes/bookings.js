const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings');
const { authenticateToken } = require('../middleware/auth');

// Protected booking actions
router.post('/', authenticateToken, bookingsController.createBooking);
router.post('/confirm', authenticateToken, bookingsController.confirmBooking);
router.post('/promo/validate', authenticateToken, bookingsController.validatePromo);
router.get('/history', authenticateToken, bookingsController.getUserBookings);
router.get('/:id', authenticateToken, bookingsController.getBookingDetails);
router.post('/:id/cancel', authenticateToken, bookingsController.cancelBooking);

// Accessible PDF download link (authorized context validated inside or simple download parameters)
router.get('/:id/pdf', bookingsController.downloadTicketPdf);

module.exports = router;
