const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get list of airports
exports.getAirports = async (req, res) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { city: 'asc' },
    });
    res.json(airports);
  } catch (error) {
    console.error('Get airports error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching airports list' });
  }
};

// Get list of airlines
exports.getAirlines = async (req, res) => {
  try {
    const airlines = await prisma.airline.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(airlines);
  } catch (error) {
    console.error('Get airlines error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching airlines list' });
  }
};

// Search flights
exports.searchFlights = async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      cabinClass = 'ECONOMY',
      passengers = 1,
      airlineIds,
      maxPrice,
      sortBy = 'price_asc',
    } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        error: true,
        message: 'Origin, destination, and departureDate are required query parameters',
      });
    }

    const passengerCount = parseInt(passengers, 10) || 1;

    // Define date boundaries for the search (start to end of day)
    const departureTimeStart = new Date(departureDate);
    departureTimeStart.setHours(0, 0, 0, 0);

    const departureTimeEnd = new Date(departureDate);
    departureTimeEnd.setHours(23, 59, 59, 999);

    // Build filter object
    const filter = {
      departureAirportId: origin,
      arrivalAirportId: destination,
      departureTime: {
        gte: departureTimeStart,
        lte: departureTimeEnd,
      },
    };

    if (airlineIds) {
      const ids = airlineIds.split(',');
      filter.airlineId = { in: ids };
    }

    // Retrieve flights matching base criteria with seats count
    const flights = await prisma.flight.findMany({
      where: filter,
      include: {
        airline: true,
        departureAirport: true,
        arrivalAirport: true,
        seats: true, // Includes seats to check availability and markup
      },
    });

    // Map and filter by seat counts, price thresholds, and add cabin details
    const filteredFlights = flights
      .map((flight) => {
        // Find seats of matching cabin class
        const cabinSeats = flight.seats.filter((s) => s.class === cabinClass);
        const availableSeats = cabinSeats.filter((s) => !s.isBooked);
        const totalSeatsCount = cabinSeats.length;

        // Calculate actual price = base price + cabin specific seat price markup (average)
        const sampleSeat = cabinSeats[0];
        const markup = sampleSeat ? sampleSeat.priceMarkup : 0;
        const ticketPrice = flight.basePrice + markup;

        return {
          id: flight.id,
          flightNumber: flight.flightNumber,
          airline: {
            id: flight.airline.id,
            name: flight.airline.name,
            code: flight.airline.code,
            logoUrl: flight.airline.logoUrl,
          },
          origin: flight.departureAirport,
          destination: flight.arrivalAirport,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          durationMinutes: flight.durationMinutes,
          basePrice: flight.basePrice,
          price: ticketPrice,
          status: flight.status,
          cabinClass,
          availableSeatsCount: availableSeats.length,
          totalSeatsCount,
          hasEnoughSeats: availableSeats.length >= passengerCount,
        };
      })
      .filter((flight) => {
        // Only return flights with sufficient seating capacity
        if (!flight.hasEnoughSeats) return false;
        // Filter by price limit if provided
        if (maxPrice && flight.price > parseFloat(maxPrice)) return false;
        return true;
      });

    // Sort results
    if (sortBy === 'price_asc') {
      filteredFlights.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      filteredFlights.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'duration_asc') {
      filteredFlights.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (sortBy === 'departure_asc') {
      filteredFlights.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
    }

    res.json(filteredFlights);
  } catch (error) {
    console.error('Search flights error:', error);
    res.status(500).json({ error: true, message: 'Server error searching for flights' });
  }
};

// Get flight seat map
exports.getFlightSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const flight = await prisma.flight.findUnique({
      where: { id },
      include: {
        seats: {
          orderBy: [
            { seatNumber: 'asc' }
          ]
        },
      },
    });

    if (!flight) {
      return res.status(404).json({ error: true, message: 'Flight not found' });
    }

    res.json({
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      seats: flight.seats.map((seat) => ({
        id: seat.id,
        seatNumber: seat.seatNumber,
        class: seat.class,
        isBooked: seat.isBooked,
        priceMarkup: seat.priceMarkup,
      })),
    });
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching flight seat details' });
  }
};
