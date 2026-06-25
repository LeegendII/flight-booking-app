const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate a unique PNR booking reference (e.g. SKY-7X9Y2)
const generatePNR = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'SKY-';
  for (let i = 0; i < 5; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

// Validate and apply promo code
exports.validatePromo = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: true, message: 'Promo code string is required' });
    }

    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.isActive || new Date(promo.expiresAt) < new Date()) {
      return res.status(400).json({ error: true, message: 'Promo code is invalid or has expired' });
    }

    res.json({
      valid: true,
      code: promo.code,
      discountValue: promo.discountValue,
      isPercentage: promo.isPercentage,
    });
  } catch (error) {
    console.error('Validate promo error:', error);
    res.status(500).json({ error: true, message: 'Server error validating promo code' });
  }
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { flightId, passengers, promoCode } = req.body;
    const userId = req.user.id;

    if (!flightId || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: true, message: 'Flight ID and passenger details array are required' });
    }

    // Run database transaction to ensure atomicity
    const bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch flight details
      const flight = await tx.flight.findUnique({
        where: { id: flightId },
        include: { airline: true },
      });
      if (!flight) {
        throw new Error('Flight not found');
      }

      // 2. Validate seat availability and lock seats
      const requestedSeatNumbers = passengers.map((p) => p.seatNumber);
      const seats = await tx.seat.findMany({
        where: {
          flightId,
          seatNumber: { in: requestedSeatNumbers },
        },
      });

      if (seats.length !== requestedSeatNumbers.length) {
        throw new Error('Some requested seats do not exist on this flight');
      }

      const bookedSeats = seats.filter((s) => s.isBooked);
      if (bookedSeats.length > 0) {
        throw new Error(`Seats already booked: ${bookedSeats.map((s) => s.seatNumber).join(', ')}`);
      }

      // 3. Calculate costs
      let baseFare = 0;
      seats.forEach((seat) => {
        baseFare += flight.basePrice + seat.priceMarkup;
      });

      // 4. Handle promo discount
      let discountAmount = 0;
      if (promoCode) {
        const promo = await tx.promoCode.findUnique({ where: { code: promoCode } });
        if (promo && promo.isActive && new Date(promo.expiresAt) >= new Date()) {
          if (promo.isPercentage) {
            discountAmount = baseFare * (promo.discountValue / 100);
          } else {
            discountAmount = promo.discountValue;
          }
        }
      }

      const taxAmount = (baseFare - discountAmount) * 0.12; // 12% airport taxes
      const totalFare = baseFare - discountAmount + taxAmount;

      // 5. Create booking record
      const bookingRef = generatePNR();
      const booking = await tx.booking.create({
        data: {
          bookingRef,
          userId,
          flightId,
          status: 'PENDING',
          totalFare,
          taxAmount,
          discountAmount,
          promoCode,
        },
      });

      // 6. Register passenger details
      const passengerDetailsData = passengers.map((p) => ({
        bookingId: booking.id,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        passportNumber: p.passportNumber,
        dateOfBirth: new Date(p.dateOfBirth),
        seatNumber: p.seatNumber,
      }));

      await tx.passengerDetails.createMany({
        data: passengerDetailsData,
      });

      // 7. Update seats as booked and associate with the booking record
      for (const seat of seats) {
        await tx.seat.update({
          where: { id: seat.id },
          data: {
            isBooked: true,
            bookingId: booking.id,
          },
        });
      }

      return {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        totalFare,
      };
    });

    res.status(201).json({
      success: true,
      message: 'Booking initialized successfully. Awaiting payment.',
      ...bookingResult,
    });
  } catch (error) {
    console.error('Create booking error:', error.message);
    res.status(400).json({ error: true, message: error.message || 'Server error creating booking' });
  }
};

// Confirm booking payment
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId, transactionId, provider, amount } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { flight: true },
    });

    if (!booking) {
      return res.status(404).json({ error: true, message: 'Booking record not found' });
    }

    // Confirm booking status
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      }),
      prisma.payment.create({
        data: {
          bookingId,
          transactionId,
          provider,
          amount,
          status: 'SUCCESS',
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Booking confirmed and ticket generated successfully',
      bookingRef: booking.bookingRef,
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: true, message: 'Server error confirming transaction' });
  }
};

// Get user booking history
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        flight: {
          include: {
            airline: true,
            departureAirport: true,
            arrivalAirport: true,
          },
        },
        passengers: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching booking history' });
  }
};

// Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        flight: {
          include: {
            airline: true,
            departureAirport: true,
            arrivalAirport: true,
          },
        },
        passengers: true,
        payment: true,
      },
    });

    if (!booking || (booking.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ error: true, message: 'Booking details not found' });
    }

    // Generate simulated PDF link & QR Check-in token
    const qrCodeCheckinToken = `SKYFLOW-CHECKIN|PNR:${booking.bookingRef}|FLIGHT:${booking.flight.flightNumber}|SEATS:${booking.passengers.map(p => p.seatNumber).join(',')}`;

    res.json({
      ...booking,
      qrToken: qrCodeCheckinToken,
      downloadPdfUrl: `/api/bookings/${booking.id}/pdf`,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching booking details' });
  }
};

// Request Cancel/Refund
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { seats: true },
    });

    if (!booking || (booking.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ error: true, message: 'Booking details not found' });
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return res.status(400).json({ error: true, message: 'Booking is already cancelled or refunded' });
    }

    // Update inside a transaction to release seats
    await prisma.$transaction(async (tx) => {
      // 1. Mark booking as cancelled
      await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // 2. Unlock all seats
      await tx.seat.updateMany({
        where: { bookingId: id },
        data: { isBooked: false, bookingId: null },
      });

      // 3. Mark payment status as REFUNDED if payment existed
      const payment = await tx.payment.findUnique({ where: { bookingId: id } });
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    });

    res.json({ success: true, message: 'Booking cancelled. Seats have been released and refund initiated.' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: true, message: 'Server error during cancellation' });
  }
};

// Download Mock e-Ticket PDF
exports.downloadTicketPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        flight: {
          include: {
            airline: true,
            departureAirport: true,
            arrivalAirport: true,
          },
        },
        passengers: true,
      },
    });

    if (!booking) {
      return res.status(404).send('Ticket not found');
    }

    // Set header content disposition to download file
    res.setHeader('Content-Type', 'text/plain'); // Sending readable textual ticket representing PDF layout
    res.setHeader('Content-Disposition', `attachment; filename=SKYFLOW-ETICKET-${booking.bookingRef}.txt`);

    let ticketText = `
=========================================
          SKYFLOW AIRLINE E-TICKET
=========================================
BOOKING REFERENCE (PNR): ${booking.bookingRef}
STATUS: ${booking.status}
BOOKING DATE: ${new Date(booking.createdAt).toLocaleString()}

FLIGHT INFO:
-----------------------------------------
Flight: ${booking.flight.flightNumber} (${booking.flight.airline.name})
From: ${booking.flight.departureAirportId} - ${booking.flight.departureAirport.name} (${booking.flight.departureAirport.city})
To: ${booking.flight.arrivalAirportId} - ${booking.flight.arrivalAirport.name} (${booking.flight.arrivalAirport.city})
Departure: ${new Date(booking.flight.departureTime).toLocaleString()}
Arrival: ${new Date(booking.flight.arrivalTime).toLocaleString()}
Duration: ${Math.floor(booking.flight.durationMinutes / 60)}h ${booking.flight.durationMinutes % 60}m

PASSENGER(S) DETAILS:
-----------------------------------------
`;

    booking.passengers.forEach((p, idx) => {
      ticketText += `${idx + 1}. ${p.firstName} ${p.lastName} | Gender: ${p.gender} | Seat: ${p.seatNumber} | Passport: ${p.passportNumber}\n`;
    });

    ticketText += `
FARE DETAILS:
-----------------------------------------
Fare Total: USD ${booking.totalFare.toFixed(2)}
(Includes Tax: USD ${booking.taxAmount.toFixed(2)} | Discount Applied: USD ${booking.discountAmount.toFixed(2)})

Thank you for flying with SkyFlow!
=========================================
`;

    res.send(ticketText);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).send('Server error generating ticket file');
  }
};
