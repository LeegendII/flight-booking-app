const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.payment.deleteMany({});
  await prisma.passengerDetails.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.flight.deleteMany({});
  await prisma.airline.deleteMany({});
  await prisma.airport.deleteMany({});
  await prisma.promoCode.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding airports...');
  const airports = [
    { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', timezone: 'America/New York', latitude: 40.6413, longitude: -73.7781 },
    { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London', latitude: 51.4700, longitude: -0.4543 },
    { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris', latitude: 49.0097, longitude: 2.5479 },
    { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai', latitude: 25.2532, longitude: 55.3657 },
    { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', latitude: 35.5494, longitude: 139.7798 },
  ];

  for (const airport of airports) {
    await prisma.airport.create({ data: airport });
  }

  console.log('Seeding airlines...');
  const airlines = [
    { code: 'DL', name: 'Delta Air Lines', logoUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&auto=format&fit=crop&q=60' },
    { code: 'BA', name: 'British Airways', logoUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=120&auto=format&fit=crop&q=60' },
    { code: 'AF', name: 'Air France', logoUrl: 'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=120&auto=format&fit=crop&q=60' },
    { code: 'EK', name: 'Emirates', logoUrl: 'https://images.unsplash.com/photo-1610967512212-4d2217d0ab51?w=120&auto=format&fit=crop&q=60' },
    { code: 'JL', name: 'Japan Airlines', logoUrl: 'https://images.unsplash.com/photo-1520437358207-3dbf5879e366?w=120&auto=format&fit=crop&q=60' },
  ];

  const airlineRecords = [];
  for (const airline of airlines) {
    const rec = await prisma.airline.create({ data: airline });
    airlineRecords.push(rec);
  }

  console.log('Seeding promo codes...');
  const promos = [
    { code: 'FLY20', discountValue: 20, isPercentage: true, expiresAt: new Date('2028-12-31'), isActive: true },
    { code: 'WEATHER10', discountValue: 10, isPercentage: true, expiresAt: new Date('2028-12-31'), isActive: true },
    { code: 'FIRSTCLASS50', discountValue: 50, isPercentage: false, expiresAt: new Date('2028-12-31'), isActive: true },
  ];
  for (const promo of promos) {
    await prisma.promoCode.create({ data: promo });
  }

  console.log('Seeding flights and seats...');
  const flightNumbersUsed = new Set();
  const getUniqueFlightNum = (airlineCode) => {
    let num;
    do {
      num = `${airlineCode}${Math.floor(100 + Math.random() * 900)}`;
    } while (flightNumbersUsed.has(num));
    flightNumbersUsed.add(num);
    return num;
  };

  // Generate flights spanning the next 15 days
  const now = new Date();
  const airportsList = ['JFK', 'LHR', 'CDG', 'DXB', 'HND'];
  let flightsCreated = 0;

  for (let day = 1; day <= 15; day++) {
    for (const origin of airportsList) {
      for (const dest of airportsList) {
        if (origin === dest) continue;

        // Create 1-2 flights per route per day
        const numFlights = Math.random() > 0.5 ? 2 : 1;

        for (let f = 0; f < numFlights; f++) {
          const airline = airlineRecords[Math.floor(Math.random() * airlineRecords.length)];
          const flightNum = getUniqueFlightNum(airline.code);

          // Hour of departure
          const departureHour = f === 0 ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
          const departureDate = new Date(now);
          departureDate.setDate(now.getDate() + day);
          departureDate.setHours(departureHour, Math.floor(Math.random() * 4) * 15, 0, 0);

          // Duration based on route (estimates)
          let duration = 480; // 8 hours
          if ((origin === 'JFK' && dest === 'LHR') || (origin === 'LHR' && dest === 'JFK')) duration = 420;
          if ((origin === 'JFK' && dest === 'CDG') || (origin === 'CDG' && dest === 'JFK')) duration = 450;
          if ((origin === 'LHR' && dest === 'CDG') || (origin === 'CDG' && dest === 'LHR')) duration = 75;
          if ((origin === 'DXB' && dest === 'LHR') || (origin === 'LHR' && dest === 'DXB')) duration = 420;
          if ((origin === 'HND' && dest === 'JFK') || (origin === 'JFK' && dest === 'HND')) duration = 840;
          if ((origin === 'HND' && dest === 'DXB') || (origin === 'DXB' && dest === 'HND')) duration = 600;

          const arrivalDate = new Date(departureDate.getTime() + duration * 60000);
          const basePrice = 250 + Math.floor(Math.random() * 450);

          const flight = await prisma.flight.create({
            data: {
              flightNumber: flightNum,
              airlineId: airline.id,
              departureAirportId: origin,
              arrivalAirportId: dest,
              departureTime: departureDate,
              arrivalTime: arrivalDate,
              durationMinutes: duration,
              basePrice: basePrice,
              status: 'SCHEDULED',
            },
          });

          flightsCreated++;

          // Seed seat layout for this flight
          const seatData = [];
          
          // First class seats (rows 1-2, seats A, F)
          for (let row = 1; row <= 2; row++) {
            for (const seatLetter of ['A', 'F']) {
              seatData.push({
                flightId: flight.id,
                seatNumber: `${row}${seatLetter}`,
                class: 'FIRST_CLASS',
                isBooked: Math.random() > 0.8, // 20% default booked
                priceMarkup: 300.0,
              });
            }
          }

          // Business class seats (rows 3-5, seats A, C, D, F)
          for (let row = 3; row <= 5; row++) {
            for (const seatLetter of ['A', 'C', 'D', 'F']) {
              seatData.push({
                flightId: flight.id,
                seatNumber: `${row}${seatLetter}`,
                class: 'BUSINESS',
                isBooked: Math.random() > 0.7, // 30% default booked
                priceMarkup: 150.0,
              });
            }
          }

          // Economy class seats (rows 6-12, seats A, B, C, D, E, F)
          for (let row = 6; row <= 12; row++) {
            for (const seatLetter of ['A', 'B', 'C', 'D', 'E', 'F']) {
              seatData.push({
                flightId: flight.id,
                seatNumber: `${row}${seatLetter}`,
                class: 'ECONOMY',
                isBooked: Math.random() > 0.4, // 60% default booked
                priceMarkup: 0.0,
              });
            }
          }

          await prisma.seat.createMany({ data: seatData });
        }
      }
    }
  }

  // Create an Admin user
  const bcrypt = require('bcryptjs');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@skyflow.com',
      fullName: 'SkyFlow Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  // Create a Standard test user
  const userPasswordHash = await bcrypt.hash('user123', 10);
  await prisma.user.create({
    data: {
      email: 'traveler@skyflow.com',
      fullName: 'Jane Doe',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });

  console.log(`Seeding complete. Created ${flightsCreated} flights.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
