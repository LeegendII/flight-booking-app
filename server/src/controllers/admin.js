const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get admin dashboard analytical reports
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Bookings count
    const totalBookingsCount = await prisma.booking.count();

    // 2. Active Users count
    const activeUsersCount = await prisma.user.count({
      where: { role: 'USER' },
    });

    // 3. Total Revenue
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true },
    });
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Popular Destinations
    const bookings = await prisma.booking.findMany({
      include: {
        flight: {
          select: { arrivalAirportId: true }
        }
      }
    });

    const destinationCounts = {};
    bookings.forEach(b => {
      if (b.flight) {
        const dest = b.flight.arrivalAirportId;
        destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
      }
    });

    const popularDestinations = Object.entries(destinationCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Flight cancellation statistics
    const totalFlights = await prisma.flight.count();
    const cancelledFlights = await prisma.flight.count({
      where: { status: 'CANCELLED' },
    });
    const delayedFlights = await prisma.flight.count({
      where: { status: 'DELAYED' },
    });

    // 6. Occupancy rates (average booking ratio across scheduled flights)
    const seatsTotal = await prisma.seat.count();
    const seatsBooked = await prisma.seat.count({ where: { isBooked: true } });
    const averageOccupancy = seatsTotal > 0 ? (seatsBooked / seatsTotal) * 100 : 0;

    // 7. Weather Impact Report (Simulated cancellation risk based on poor weather forecast coordinates)
    const weatherImpactRisk = [
      { city: 'London', cancellationRisk: 'Medium (15%)', alert: 'Frequent Rain & Showers' },
      { city: 'Dubai', cancellationRisk: 'Low (2%)', alert: 'Clear Sky / Extreme Heat' },
      { city: 'Tokyo', cancellationRisk: 'Low (5%)', alert: 'Mild Wind' },
      { city: 'New York', cancellationRisk: 'Medium (8%)', alert: 'Occasional Cloud Cover' },
      { city: 'Paris', cancellationRisk: 'Low (6%)', alert: 'Passing Overcast' },
    ];

    res.json({
      metrics: {
        totalBookings: totalBookingsCount,
        activeUsers: activeUsersCount,
        totalRevenue,
        averageOccupancy: Math.round(averageOccupancy * 10) / 10,
        cancellationRatio: totalFlights > 0 ? Math.round((cancelledFlights / totalFlights) * 100) : 0,
      },
      flightsOverview: {
        total: totalFlights,
        scheduled: totalFlights - cancelledFlights - delayedFlights,
        cancelled: cancelledFlights,
        delayed: delayedFlights,
      },
      popularDestinations,
      weatherImpactRisk,
      revenueHistory: [
        { month: 'Jan', revenue: totalRevenue * 0.1 },
        { month: 'Feb', revenue: totalRevenue * 0.12 },
        { month: 'Mar', revenue: totalRevenue * 0.15 },
        { month: 'Apr', revenue: totalRevenue * 0.18 },
        { month: 'May', revenue: totalRevenue * 0.2 },
        { month: 'Jun', revenue: totalRevenue * 0.25 },
      ],
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: true, message: 'Server error generating analytics metrics' });
  }
};

// Flight mutations: Create Flight
exports.createFlight = async (req, res) => {
  try {
    const {
      flightNumber,
      airlineId,
      departureAirportId,
      arrivalAirportId,
      departureTime,
      arrivalTime,
      durationMinutes,
      basePrice,
    } = req.body;

    if (!flightNumber || !airlineId || !departureAirportId || !arrivalAirportId || !departureTime || !arrivalTime || !basePrice) {
      return res.status(400).json({ error: true, message: 'Required flight details are missing' });
    }

    const flight = await prisma.$transaction(async (tx) => {
      const newFlight = await tx.flight.create({
        data: {
          flightNumber,
          airlineId,
          departureAirportId,
          arrivalAirportId,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          durationMinutes: parseInt(durationMinutes, 10) || 120,
          basePrice: parseFloat(basePrice),
          status: 'SCHEDULED',
        },
      });

      // Create seats layout automatically
      const seats = [];
      // First class (rows 1-2, seats A, F)
      for (let row = 1; row <= 2; row++) {
        for (const seatLetter of ['A', 'F']) {
          seats.push({ flightId: newFlight.id, seatNumber: `${row}${seatLetter}`, class: 'FIRST_CLASS', priceMarkup: 300.0 });
        }
      }
      // Business (rows 3-5, seats A, C, D, F)
      for (let row = 3; row <= 5; row++) {
        for (const seatLetter of ['A', 'C', 'D', 'F']) {
          seats.push({ flightId: newFlight.id, seatNumber: `${row}${seatLetter}`, class: 'BUSINESS', priceMarkup: 150.0 });
        }
      }
      // Economy (rows 6-12, seats A, B, C, D, E, F)
      for (let row = 6; row <= 12; row++) {
        for (const seatLetter of ['A', 'B', 'C', 'D', 'E', 'F']) {
          seats.push({ flightId: newFlight.id, seatNumber: `${row}${seatLetter}`, class: 'ECONOMY', priceMarkup: 0.0 });
        }
      }

      await tx.seat.createMany({ data: seats });
      return newFlight;
    });

    res.status(201).json(flight);
  } catch (error) {
    console.error('Create flight error:', error);
    res.status(500).json({ error: true, message: 'Server error scheduling new flight' });
  }
};

// Flight mutations: Update Flight status (Delay/Cancel)
exports.updateFlightStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, departureTime, arrivalTime } = req.body;

    const currentFlight = await prisma.flight.findUnique({ where: { id } });
    if (!currentFlight) {
      return res.status(404).json({ error: true, message: 'Flight not found' });
    }

    const updateData = { status };
    if (departureTime) updateData.departureTime = new Date(departureTime);
    if (arrivalTime) updateData.arrivalTime = new Date(arrivalTime);

    // If flight is CANCELLED, we release seats associated with active bookings
    if (status === 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        // Find bookings for this flight
        const bookings = await tx.booking.findMany({
          where: { flightId: id, status: { in: ['PENDING', 'CONFIRMED'] } }
        });
        const bookingIds = bookings.map(b => b.id);

        // Cancel bookings
        await tx.booking.updateMany({
          where: { flightId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
          data: { status: 'CANCELLED' }
        });

        // Release seats
        await tx.seat.updateMany({
          where: { flightId: id },
          data: { isBooked: false, bookingId: null }
        });

        // Update flight status
        await tx.flight.update({
          where: { id },
          data: updateData
        });
      });
    } else {
      await prisma.flight.update({
        where: { id },
        data: updateData,
      });
    }

    res.json({ success: true, message: `Flight status updated to ${status} successfully` });
  } catch (error) {
    console.error('Update flight status error:', error);
    res.status(500).json({ error: true, message: 'Server error updating flight details' });
  }
};
