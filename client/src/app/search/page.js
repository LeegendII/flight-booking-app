'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { selectOutboundFlight, selectReturnFlight } from '../../store/bookingSlice';
import { flightsApi, weatherApi } from '../../services/api';
import { Plane, Calendar, ArrowRight, Thermometer, Wind, Droplets, Info, Filter, ArrowUpDown } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { searchParams, selectedOutbound, selectedReturn } = useSelector((state) => state.booking);

  // Search parameters destructuring
  const { origin, destination, departureDate, returnDate, cabinClass, passengers } = searchParams;

  // Active step: 'outbound' or 'return'
  const [currentLeg, setCurrentLeg] = useState('outbound');
  
  // Data states
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting
  const [selectedAirlineId, setSelectedAirlineId] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState(2000);
  const [sortBy, setSortBy] = useState('price_asc');

  // Set leg step based on Redux state
  useEffect(() => {
    if (returnDate && !selectedOutbound) {
      setCurrentLeg('outbound');
    } else if (returnDate && selectedOutbound && !selectedReturn) {
      setCurrentLeg('return');
    } else {
      setCurrentLeg('outbound');
    }
  }, [selectedOutbound, selectedReturn, returnDate]);

  // Load flights and weather
  useEffect(() => {
    if (!origin || !destination) {
      router.push('/');
      return;
    }

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch airlines for filter dropdown
        const airlinesData = await flightsApi.getAirlines();
        setAirlines(airlinesData);

        // 2. Fetch flights based on leg
        const activeOrigin = currentLeg === 'outbound' ? origin : destination;
        const activeDest = currentLeg === 'outbound' ? destination : origin;
        const activeDate = currentLeg === 'outbound' ? departureDate : returnDate;

        const flightsData = await flightsApi.search({
          origin: activeOrigin,
          destination: activeDest,
          departureDate: activeDate,
          cabinClass,
          passengers,
          sortBy,
        });
        setFlights(flightsData);

        // 3. Fetch weather for arrival city
        const cityLookup = flightsData[0]?.destination?.city || (currentLeg === 'outbound' ? 'London' : 'New York');
        const weatherData = await weatherApi.getWeather(cityLookup);
        setWeather(weatherData);

      } catch (err) {
        console.error('Error fetching search details:', err);
        setError('No direct flights found matching your routing or dates.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentLeg, origin, destination, departureDate, returnDate, cabinClass, passengers, sortBy, router]);

  // Apply filters
  const filteredFlights = flights.filter((flight) => {
    if (selectedAirlineId !== 'all' && flight.airline.id !== selectedAirlineId) return false;
    if (flight.price > maxPriceFilter) return false;
    return true;
  });

  // Handle flight selection
  const handleSelectFlight = (flight) => {
    if (currentLeg === 'outbound') {
      dispatch(selectOutboundFlight(flight));
      if (returnDate) {
        setCurrentLeg('return');
      } else {
        router.push('/checkout');
      }
    } else {
      dispatch(selectReturnFlight(flight));
      router.push('/checkout');
    }
  };

  const activeOriginCity = currentLeg === 'outbound' ? origin : destination;
  const activeDestCity = currentLeg === 'outbound' ? destination : origin;
  const activeDateValue = currentLeg === 'outbound' ? departureDate : returnDate;

  return (
    <div className="space-y-8">
      {/* Search Header summary */}
      <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 glass">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary/10 p-3 rounded-2xl text-brand-primary">
            <Plane className={`w-6 h-6 ${currentLeg === 'return' ? 'rotate-185' : 'rotate-45'}`} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {currentLeg === 'outbound' ? 'Step 1: Select Outbound' : 'Step 2: Select Return'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl font-extrabold">{activeOriginCity}</h2>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <h2 className="text-xl font-extrabold">{activeDestCity}</h2>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-semibold border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{new Date(activeDateValue).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <span>Cabin: {cabinClass.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <span>Passengers: {passengers}</span>
          </div>
        </div>
      </div>

      {/* Destination Weather integration widget */}
      {weather && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Arrival Climate Metrics</span>
              <h3 className="text-2xl font-extrabold">Destination Weather: {weather.temp}°C, {weather.condition}</h3>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-sm font-bold shadow-md">
              <span className="text-lg">{weather.suitability?.color}</span>
              <span>Travel Suitability: {weather.suitability?.text}</span>
            </div>
          </div>

          {/* Core Weather grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-slate-400 text-xxs font-bold uppercase block">Avg Temperature</span>
                <span className="text-sm font-bold">{weather.temp}°C</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Wind className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-slate-400 text-xxs font-bold uppercase block">Wind Speed</span>
                <span className="text-sm font-bold">{weather.windSpeed} km/h</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Droplets className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-slate-400 text-xxs font-bold uppercase block">Rain Probability</span>
                <span className="text-sm font-bold">{weather.rainProb}%</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Info className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-slate-400 text-xxs font-bold uppercase block">Humidity</span>
                <span className="text-sm font-bold">{weather.humidity}%</span>
              </div>
            </div>
          </div>

          {/* AI travel warning banner */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl text-xs md:text-sm text-slate-200 italic">
            <strong>AI Travel Advice:</strong> {weather.advisory}
          </div>

          {/* 7-day forecast Carousel layout */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">7-Day Local Forecast</h4>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {weather.forecast.map((f, idx) => (
                <div key={idx} className="flex-shrink-0 bg-white/5 border border-white/5 rounded-2xl p-4 w-28 text-center space-y-2">
                  <span className="text-xxs text-slate-400 font-bold uppercase block">{f.day.substring(0,3)}</span>
                  <span className="text-lg block font-extrabold">{f.temp}°C</span>
                  <span className="text-xxs block font-semibold text-indigo-300 truncate">{f.condition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left column: Filters & Sorters */}
        <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm space-y-6 glass">
          <div className="flex items-center gap-2 border-b border-card-border pb-4">
            <Filter className="w-5 h-5 text-brand-primary" />
            <h3 className="font-extrabold text-lg">Filter & Sort</h3>
          </div>

          {/* Sort selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Sort Results By</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold cursor-pointer"
              >
                <option value="price_asc">Price: Lowest First</option>
                <option value="price_desc">Price: Highest First</option>
                <option value="duration_asc">Duration: Shortest First</option>
                <option value="departure_asc">Time: Earliest First</option>
              </select>
            </div>
          </div>

          {/* Airline selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Airlines</label>
            <select
              value={selectedAirlineId}
              onChange={(e) => setSelectedAirlineId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold cursor-pointer"
            >
              <option value="all">All Airlines</option>
              {airlines.map((al) => (
                <option key={al.id} value={al.id}>
                  {al.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Max Budget</span>
              <span className="text-brand-primary font-extrabold text-sm">USD {maxPriceFilter}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
          </div>
        </div>

        {/* Right column: Flights list */}
        <div className="lg:col-span-3 space-y-4">
          
          {loading ? (
            /* Skeleton loaders */
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-card border border-card-border rounded-3xl p-6 shadow-sm space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl col-span-2"></div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
              </div>
            ))
          ) : error || filteredFlights.length === 0 ? (
            <div className="bg-card border border-card-border rounded-3xl p-12 text-center shadow-sm glass">
              <Plane className="w-12 h-12 text-slate-300 mx-auto rotate-45 mb-4" />
              <h3 className="text-lg font-bold">No Flights Found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
                We couldn&apos;t find any flights matching your criteria. Try adjusting your price budget or changing dates.
              </p>
            </div>
          ) : (
            filteredFlights.map((flight) => (
              <div
                key={flight.id}
                className="bg-card border border-card-border rounded-3xl p-6 shadow-sm hover-card-trigger relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
              >
                
                {/* Airline details */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-card-border">
                    {flight.airline.logoUrl ? (
                      <img src={flight.airline.logoUrl} alt={flight.airline.name} className="w-full h-full object-cover" />
                    ) : (
                      <Plane className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{flight.airline.name}</h4>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{flight.flightNumber}</span>
                  </div>
                </div>

                {/* Times & duration */}
                <div className="flex items-center justify-between gap-6 w-full md:w-auto flex-1 max-w-md">
                  <div className="text-center md:text-left">
                    <span className="text-2xl font-black block">
                      {new Date(flight.departureTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{flight.origin.code}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center relative">
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">
                      {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m
                    </span>
                    <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-800 my-2 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-card-border p-1 rounded-full text-brand-primary">
                        <Plane className="w-3.5 h-3.5 rotate-45" />
                      </div>
                    </div>
                    <span className="text-xxs font-extrabold text-green-500 uppercase tracking-wide">Direct Flight</span>
                  </div>

                  <div className="text-center md:text-right">
                    <span className="text-2xl font-black block">
                      {new Date(flight.arrivalTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{flight.destination.code}</span>
                  </div>
                </div>

                {/* Booking metrics & Price */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <span className="text-xxs font-bold text-slate-400 uppercase block">Total Price</span>
                    <span className="text-2xl font-black text-brand-primary">USD {flight.price}</span>
                    <span className="text-xxs font-bold text-green-500 block">{flight.availableSeatsCount} seats left</span>
                  </div>
                  
                  <button
                    onClick={() => handleSelectFlight(flight)}
                    className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-extrabold tracking-wide uppercase rounded-xl shadow-md shadow-brand-primary/10 transition-all hover:scale-[1.03]"
                  >
                    Select Flight
                  </button>
                </div>

              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
}
