const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Stripe Payment Intent Simulation
exports.createStripePaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: true, message: 'Booking ID is required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: true, message: 'Booking not found' });
    }

    // If Stripe is configured in environment, execute Stripe API call here
    // For local running, we generate a mock client secret
    const mockClientSecret = `pi_mock_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 10)}`;

    res.json({
      clientSecret: mockClientSecret,
      amount: booking.totalFare,
      currency: 'usd',
      bookingId: booking.id,
      message: 'Stripe payment intent generated successfully'
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ error: true, message: 'Server error generating payment intent' });
  }
};

// PayPal Payment Execution Simulation
exports.executePayPalPayment = async (req, res) => {
  try {
    const { bookingId, paypalOrderId } = req.body;

    if (!bookingId || !paypalOrderId) {
      return res.status(400).json({ error: true, message: 'Booking ID and PayPal Order ID are required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: true, message: 'Booking not found' });
    }

    // Simulate PayPal Capture API call
    const mockTransactionId = `PAY-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;

    res.json({
      success: true,
      transactionId: mockTransactionId,
      status: 'COMPLETED',
      bookingId,
      message: 'PayPal payment processed successfully'
    });
  } catch (error) {
    console.error('PayPal payment error:', error);
    res.status(500).json({ error: true, message: 'Server error processing PayPal payment' });
  }
};

// Flutterwave Payment Integration Simulation (for African users)
exports.createFlutterwaveCharge = async (req, res) => {
  try {
    const { bookingId, phoneNumber, email, network } = req.body; // e.g. MTN, Airtel, Orange for Mobile Money

    if (!bookingId || !email) {
      return res.status(400).json({ error: true, message: 'Booking ID and customer email are required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: true, message: 'Booking not found' });
    }

    // Simulate Flutterwave Mobile Money/Card payment trigger
    const mockTransactionId = `FLW-${Math.random().toString(36).toUpperCase().substring(2, 12)}`;
    const mockRef = `flw_ref_${Math.random().toString(36).substring(2, 8)}`;

    res.json({
      status: 'success',
      message: 'Flutterwave charge initiated successfully',
      data: {
        id: Math.floor(Math.random() * 1000000),
        tx_ref: mockRef,
        flw_ref: mockTransactionId,
        amount: booking.totalFare,
        currency: 'NGN', // Often processes local currency
        charged_amount: booking.totalFare * 1500, // Conversion rate simulation
        status: 'successful',
        customer: {
          email,
          phone_number: phoneNumber || 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Flutterwave payment error:', error);
    res.status(500).json({ error: true, message: 'Server error processing Flutterwave payment' });
  }
};

// Get payment logs by Booking ID
exports.getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return res.status(404).json({ error: true, message: 'Payment logs not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching transaction details' });
  }
};
