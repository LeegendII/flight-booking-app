'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchParams } from '../store/bookingSlice';
import { flightsApi, weatherApi } from '../services/api';
import { Plane, Calendar, Users, Briefcase, Search, ArrowDown, MapPin, CloudSun, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { searchParams, token, user } = useSelector((state) => state.booking);

  // Local Form states
  const [tripType, setTripType] = useState('round');
  const [origin, setOrigin] = useState(searchParams.origin || 'JFK');
  const [destination, setDestination] = useState(searchParams.destination || 'LHR');
  const [departureDate, setDepartureDate] = useState(searchParams.departureDate || '');
  const [returnDate, setReturnDate] = useState(searchParams.returnDate || '');
  const [cabinClass, setCabinClass] = useState(searchParams.cabinClass || 'ECONOMY');
  const [passengers, setPassengers] = useState(searchParams.passengers || 1);

  // Lists & API states
  const [airports, setAirports] = useState([]);
  const [destinationWeather, setDestinationWeather] = useState({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  const searchRef = useRef(null);

  // Fetch airports
  useEffect(() => {
    async function loadAirports() {
      try {
        const data = await flightsApi.getAirports();
        setAirports(data);
      } catch (err) {
        console.error('Failed to load airports:', err);
      }
    }
    loadAirports();
  }, []);

  // Fetch weather preview for destination
  useEffect(() => {
    if (!destination) return;
    const destAirport = airports.find(a => a.code === destination);
    if (!destAirport) return;

    async function loadWeather() {
      setWeatherLoading(true);
      try {
        const data = await weatherApi.getWeather(destAirport.city);
        setDestinationWeather(data);
      } catch (err) {
        console.error('Failed to load weather preview:', err);
      } finally {
        setWeatherLoading(false);
      }
    }

    loadWeather();
  }, [destination, airports]);

  // Set default dates if empty
  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split('T')[0];
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    if (!departureDate) setDepartureDate(tomorrowStr);
    if (!returnDate) setReturnDate(nextWeekStr);
  }, []);

  // Search submit handler
  const handleSearch = (e) => {
    e.preventDefault();
    const params = {
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round' ? returnDate : '',
      cabinClass,
      passengers: parseInt(passengers, 10),
    };
    dispatch(setSearchParams(params));
    router.push('/search');
  };

  // Click on "BookNow" start button
  const handleBookNowClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      setShowSearchPanel(true);
      setTimeout(() => {
        searchRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handlePopularClick = (destCode) => {
    setDestination(destCode);
    const today = new Date();
    today.setDate(today.getDate() + 2);
    setDepartureDate(today.toISOString().split('T')[0]);
    setShowSearchPanel(true);
    setTimeout(() => {
      searchRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-16">
      
      {/* Luxury Asymmetrical Split Hero Screen */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh] rounded-3xl overflow-hidden border border-card-border bg-black shadow-2xl relative">
        
        {/* Left Side: Brand Typography & BookNow start button */}
        <div className="flex flex-col justify-between p-8 md:p-16 border-r border-card-border text-[#f5f0e8] relative z-10 bg-[#050505]">
          <div className="space-y-8">
            <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
              Weaver of visual journeys
            </span>
            
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.9] uppercase">
              SkyFlow <br />
              Bespoke <br />
              Aviation <br />
              Portal
            </h1>
          </div>

          <div className="space-y-12 mt-12 lg:mt-0">
            {/* Custom "BookNow" Start Button */}
            <button
              onClick={handleBookNowClick}
              className="group px-8 py-4 bg-[#D4AF37] hover:bg-[#C5A028] text-black text-sm font-extrabold tracking-widest uppercase rounded-none border border-black shadow-lg transition-all hover:scale-[1.02] flex items-center gap-3"
            >
              <span>BookNow</span>
              <Plane className="w-4 h-4 rotate-45 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Bottom Details with Arrow Down */}
            <div className="flex items-end justify-between">
              <span className="text-xs uppercase tracking-widest font-black text-slate-500">
                AESTHETIC DEPARTURE 2026
              </span>
              <button
                onClick={() => {
                  setShowSearchPanel(true);
                  setTimeout(() => {
                    searchRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="p-3 border border-card-border rounded-full hover:border-[#D4AF37] transition-all text-[#D4AF37] hover:scale-105"
              >
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Tablet look-book display */}
        <div className="relative bg-[#0a0a0a] overflow-hidden flex items-center justify-center p-8 md:p-12">
          {/* Simulated strong diagonal lighting shadow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/10 pointer-events-none z-10"></div>
          
          {/* Leather texture / shadow effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(140,63,63,0.15),transparent)] pointer-events-none"></div>

          {/* iPad Mockup tilted */}
          <div className="relative w-full max-w-sm aspect-[4/5] bg-slate-950 border-[10px] border-slate-900 rounded-[36px] shadow-2xl overflow-hidden transform rotate-6 hover:rotate-2 transition-transform duration-700 ease-out z-20">
            {/* Tablet Gloss shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none"></div>
            
            {/* Tablet Camera dot */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800"></div>

            {/* Look book layout content */}
            <div className="w-full h-full bg-[#111111] p-6 flex flex-col justify-between text-white relative">
              {/* Arch decoration shape mimicking the screenshot style */}
              <div className="absolute bottom-0 left-0 right-0 top-1/4 bg-[#D4AF37]/10 border-t border-x border-[#D4AF37]/20 rounded-t-[120px] m-4 pointer-events-none"></div>

              {/* Top header */}
              <div className="flex justify-between items-center z-10">
                <span className="text-[10px] tracking-wider uppercase opacity-80 font-bold">First Class Suite</span>
                <span className="text-[10px] tracking-wider uppercase opacity-80 font-bold">Wares 01</span>
              </div>

              {/* Illustration mockup mimicking arch frame */}
              <div className="flex-1 flex items-center justify-center relative my-4">
                <div className="w-40 aspect-[3/4] bg-[#0a0a0a] border border-[#D4AF37]/25 rounded-t-[80px] overflow-hidden shadow-inner flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=300&auto=format&fit=crop&q=80"
                    alt="Luxury Suite cabin"
                    className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Wares main serif layout */}
              <div className="space-y-1 z-10 text-center">
                <h3 className="font-serif text-4xl font-extrabold tracking-tight text-[#D4AF37] leading-none">
                  Wares
                </h3>
                <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-black block">
                  Look Book 2026
                </span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Flight Search Widget Container - Revealed by Scroll or BookNow */}
      <div
        ref={searchRef}
        className={`transition-all duration-700 ${
          showSearchPanel ? 'opacity-100 scale-100' : 'opacity-80 scale-[0.99] pointer-events-none'
        }`}
      >
        <div className="bg-card border border-card-border rounded-3xl shadow-xl p-6 md:p-8 glass">
          <div className="mb-6 flex items-center gap-2 text-brand-primary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-black">Bespoke Flight Desk</span>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            {/* Trip type buttons */}
            <div className="flex items-center gap-3 border-b border-card-border pb-4">
              <button
                type="button"
                onClick={() => setTripType('round')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                  tripType === 'round'
                    ? 'bg-brand-primary text-black font-black'
                    : 'bg-[#111111] text-slate-400 hover:bg-[#1a1a1a]'
                }`}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => setTripType('one')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                  tripType === 'one'
                    ? 'bg-brand-primary text-black font-black'
                    : 'bg-[#111111] text-slate-400 hover:bg-[#1a1a1a]'
                }`}
              >
                One Way
              </button>
            </div>

            {/* Form core grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Origin */}
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Departure City
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-card-border rounded-2xl py-3 px-4 text-sm font-semibold cursor-pointer text-[#f5f0e8]"
                >
                  {airports.map((ap) => (
                    <option key={ap.code} value={ap.code}>
                      {ap.city} ({ap.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-accent" /> Arrival City
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-card-border rounded-2xl py-3 px-4 text-sm font-semibold cursor-pointer text-[#f5f0e8]"
                >
                  {airports.map((ap) => (
                    <option key={ap.code} value={ap.code}>
                      {ap.city} ({ap.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Departure Date
                </label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold text-[#f5f0e8]"
                />
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Return Date
                </label>
                <input
                  type="date"
                  required={tripType === 'round'}
                  disabled={tripType === 'one'}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold text-[#f5f0e8] disabled:opacity-30"
                />
              </div>
            </div>

            {/* Secondary settings grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Passengers */}
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-brand-primary" /> Passengers
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  required
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold text-[#f5f0e8]"
                />
              </div>

              {/* Cabin Class */}
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-brand-primary" /> Seating Class
                </label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-card-border rounded-2xl py-3 px-4 text-sm font-semibold cursor-pointer text-[#f5f0e8]"
                >
                  <option value="ECONOMY">Economy Suite</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business Cabin</option>
                  <option value="FIRST_CLASS">First Class Lounge</option>
                </select>
              </div>

              {/* Search Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-black text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search Available flights</span>
              </button>
            </div>
          </form>

          {/* Destination Weather integration widget */}
          {destinationWeather && destinationWeather.condition && (
            <div className="mt-8 border-t border-card-border pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0a0a]/50 p-4 rounded-2xl border border-card-border">
              <div className="flex items-center gap-3">
                <div className="bg-brand-primary/10 p-3 rounded-xl text-brand-primary">
                  <CloudSun className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 block uppercase tracking-widest">Arrival Weather Forecast</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {airports.find(a => a.code === destination)?.city || 'Destination'}: {destinationWeather.temp}°C, {destinationWeather.condition}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block md:text-right">Travel Index</span>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111111] border border-card-border text-xs font-bold shadow-sm text-brand-primary">
                  <span>{destinationWeather.suitability?.color}</span>
                  <span>{destinationWeather.suitability?.text}</span>
                </div>
              </div>

              <div className="text-xs md:max-w-md bg-brand-primary/5 border border-brand-primary/10 text-brand-primary p-3 rounded-xl italic">
                <strong>AI Suite Advisory:</strong> {destinationWeather.advisory}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trending Destinations Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-extrabold uppercase text-[#f5f0e8]">Bespoke Escapes</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Explore hub climates and reserve direct routes immediately.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* London */}
          <div
            onClick={() => handlePopularClick('LHR')}
            className="group cursor-pointer bg-card border border-card-border rounded-3xl overflow-hidden hover-card-trigger"
          >
            <div className="h-44 relative overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&auto=format&fit=crop&q=80"
                alt="London"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
              />
              <span className="absolute top-4 right-4 bg-black/80 text-[#D4AF37] text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-card-border tracking-wider">
                LHR
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-brand-primary transition-colors">London, UK</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Historic architecture meets rainy avenues. Beautiful museum escapes and grand parks.</p>
              <div className="pt-2 border-t border-card-border flex items-center justify-between text-xxs text-slate-500">
                <span>Suitable: May - Sep</span>
                <span className="font-extrabold text-brand-primary">Reserve &rarr;</span>
              </div>
            </div>
          </div>

          {/* Dubai */}
          <div
            onClick={() => handlePopularClick('DXB')}
            className="group cursor-pointer bg-card border border-card-border rounded-3xl overflow-hidden hover-card-trigger"
          >
            <div className="h-44 relative overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&auto=format&fit=crop&q=80"
                alt="Dubai"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
              />
              <span className="absolute top-4 right-4 bg-black/80 text-[#D4AF37] text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-card-border tracking-wider">
                DXB
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-brand-primary transition-colors">Dubai, UAE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Towering modern skyscrapers, hot sunny climates, and luxury shopping suites.</p>
              <div className="pt-2 border-t border-card-border flex items-center justify-between text-xxs text-slate-500">
                <span>Suitable: Nov - Mar</span>
                <span className="font-extrabold text-brand-primary">Reserve &rarr;</span>
              </div>
            </div>
          </div>

          {/* Tokyo */}
          <div
            onClick={() => handlePopularClick('HND')}
            className="group cursor-pointer bg-card border border-card-border rounded-3xl overflow-hidden hover-card-trigger"
          >
            <div className="h-44 relative overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&auto=format&fit=crop&q=80"
                alt="Tokyo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
              />
              <span className="absolute top-4 right-4 bg-black/80 text-[#D4AF37] text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-card-border tracking-wider">
                HND
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-brand-primary transition-colors">Tokyo, Japan</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Neon grids, cherry blossom gardens, ancient temples, and culinary artistry.</p>
              <div className="pt-2 border-t border-card-border flex items-center justify-between text-xxs text-slate-500">
                <span>Suitable: Apr - May</span>
                <span className="font-extrabold text-brand-primary">Reserve &rarr;</span>
              </div>
            </div>
          </div>

          {/* Paris */}
          <div
            onClick={() => handlePopularClick('CDG')}
            className="group cursor-pointer bg-card border border-card-border rounded-3xl overflow-hidden hover-card-trigger"
          >
            <div className="h-44 relative overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop&q=80"
                alt="Paris"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
              />
              <span className="absolute top-4 right-4 bg-black/80 text-[#D4AF37] text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-card-border tracking-wider">
                CDG
              </span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-brand-primary transition-colors">Paris, France</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Romantic bistros, passing overcast clouds, the Louvre, and artistic avenues.</p>
              <div className="pt-2 border-t border-card-border flex items-center justify-between text-xxs text-slate-500">
                <span>Suitable: Jun - Aug</span>
                <span className="font-extrabold text-brand-primary">Reserve &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
