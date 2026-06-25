'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { adminApi, flightsApi } from '../../services/api';
import { LayoutDashboard, Users, CreditCard, Armchair, Ban, AlertTriangle, Plus, ShieldCheck, RefreshCw, Plane } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.booking);

  // Stats data
  const [stats, setStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add flight form states
  const [flightNumber, setFlightNumber] = useState('');
  const [airlineId, setAirlineId] = useState('');
  const [origin, setOrigin] = useState('JFK');
  const [destination, setDestination] = useState('LHR');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [basePrice, setBasePrice] = useState('');
  
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // List arrays
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (user && user.role !== 'ADMIN') {
      setError('Access denied: You must be an administrator to access this dashboard.');
      setLoading(false);
    }
  }, [user, token, router]);

  // Load analytics & flights lists
  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      // Load stats
      const statsRes = await adminApi.getStats();
      setStats(statsRes);

      // Load flights for list controls (search JFK -> LHR tomorrow to populate initial controls list)
      const today = new Date();
      today.setDate(today.getDate() + 2);
      const searchDate = today.toISOString().split('T')[0];
      const flightsRes = await flightsApi.search({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: searchDate,
      });
      setFlights(flightsRes);

      // Load selections fields
      const airportsData = await flightsApi.getAirports();
      setAirports(airportsData);

      const airlinesData = await flightsApi.getAirlines();
      setAirlines(airlinesData);
      if (airlinesData.length > 0) setAirlineId(airlinesData[0].id);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadDashboard();
    }
  }, [user]);

  // Handle Create Flight schedule
  const handleCreateFlight = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      // Calculate duration roughly
      const dep = new Date(departureTime);
      const arr = new Date(arrivalTime);
      const durationMinutes = Math.floor((arr - dep) / 60000);

      if (durationMinutes <= 0) {
        throw new Error('Arrival time must be after departure time');
      }

      await adminApi.createFlight({
        flightNumber,
        airlineId,
        departureAirportId: origin,
        arrivalAirportId: destination,
        departureTime,
        arrivalTime,
        durationMinutes,
        basePrice: parseFloat(basePrice),
      });

      setFormSuccess(`Flight ${flightNumber} scheduled and seat layout created successfully!`);
      // Reset form
      setFlightNumber('');
      setDepartureTime('');
      setArrivalTime('');
      setBasePrice('');
      
      // Reload stats
      await loadDashboard();
    } catch (err) {
      setFormError(err.message || 'Failed to create flight');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delay/cancel status modifications
  const handleUpdateStatus = async (flightId, status) => {
    try {
      await adminApi.updateFlightStatus(flightId, { status });
      alert(`Flight status successfully marked as ${status}`);
      await loadDashboard();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-primary animate-spin"></div>
        <span className="text-sm text-slate-400 font-bold">Retrieving administrative logs...</span>
      </div>
    );
  }

  if (error || (user && user.role !== 'ADMIN')) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-3xl text-center max-w-md mx-auto space-y-4 my-12">
        <AlertTriangle className="w-12 h-12 mx-auto" />
        <h3 className="text-lg font-bold">Permissions Error</h3>
        <p className="text-xs leading-relaxed">{error || 'Access Denied.'}</p>
        <button onClick={() => router.push('/')} className="px-6 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-card-border pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-brand-primary" /> System Admin Control Panel
          </h2>
          <p className="text-sm text-slate-400">Manage global airport hubs, schedule flights, track occupancy, and monitor weather cancel index.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="p-2.5 rounded-xl border border-card-border bg-card dark:bg-slate-900 text-slate-500 hover:text-brand-primary hover:bg-indigo-500/5 transition-all"
          title="Refresh Dashboard"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-card border border-card-border rounded-3xl p-5 shadow-sm glass">
            <Users className="w-8 h-8 text-brand-primary mb-3" />
            <span className="text-slate-400 text-xxs font-bold uppercase block">Active Travelers</span>
            <span className="text-2xl font-black">{stats.metrics.activeUsers}</span>
          </div>

          <div className="bg-card border border-card-border rounded-3xl p-5 shadow-sm glass">
            <Plane className="w-8 h-8 text-indigo-500 rotate-45 mb-3" />
            <span className="text-slate-400 text-xxs font-bold uppercase block">Total Bookings</span>
            <span className="text-2xl font-black">{stats.metrics.totalBookings}</span>
          </div>

          <div className="bg-card border border-card-border rounded-3xl p-5 shadow-sm glass">
            <CreditCard className="w-8 h-8 text-green-500 mb-3" />
            <span className="text-slate-400 text-xxs font-bold uppercase block">Gross Revenue</span>
            <span className="text-2xl font-black text-green-500">USD {stats.metrics.totalRevenue.toFixed(2)}</span>
          </div>

          <div className="bg-card border border-card-border rounded-3xl p-5 shadow-sm glass">
            <Armchair className="w-8 h-8 text-purple-500 mb-3" />
            <span className="text-slate-400 text-xxs font-bold uppercase block">Seat Occupancy Ratio</span>
            <span className="text-2xl font-black">{stats.metrics.averageOccupancy}%</span>
          </div>

          <div className="bg-card border border-card-border rounded-3xl p-5 shadow-sm glass">
            <Ban className="w-8 h-8 text-red-500 mb-3" />
            <span className="text-slate-400 text-xxs font-bold uppercase block">Cancellation Ratio</span>
            <span className="text-2xl font-black">{stats.metrics.cancellationRatio}%</span>
          </div>
        </div>
      )}

      {/* Double columns content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Schedulers */}
        <div className="lg:col-span-1 space-y-8">
          {/* Create Flight Widget */}
          <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass">
            <h3 className="font-extrabold text-lg border-b border-card-border pb-3 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-primary" /> Schedule New Flight
            </h3>

            {formError && <span className="text-xxs text-red-500 font-bold block mb-4">{formError}</span>}
            {formSuccess && <span className="text-xxs text-green-500 font-bold block mb-4">{formSuccess}</span>}

            <form onSubmit={handleCreateFlight} className="space-y-4">
              {/* Flight Code */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Flight Number</label>
                <input
                  type="text"
                  required
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. BA249"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-3 text-sm font-semibold"
                />
              </div>

              {/* Airline */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Airline Carrier</label>
                <select
                  value={airlineId}
                  onChange={(e) => setAirlineId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2.5 px-3 text-sm font-semibold cursor-pointer"
                >
                  {airlines.map((al) => (
                    <option key={al.id} value={al.id}>
                      {al.name} ({al.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Origin</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-3 text-sm font-semibold cursor-pointer"
                  >
                    {airports.map((ap) => (
                      <option key={ap.code} value={ap.code}>
                        {ap.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dest */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Destination</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-3 text-sm font-semibold cursor-pointer"
                  >
                    {airports.map((ap) => (
                      <option key={ap.code} value={ap.code}>
                        {ap.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date times */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-3 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-3 text-sm font-semibold"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Base Price (USD)</label>
                <input
                  type="number"
                  required
                  min="50"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="300"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-3 text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg transition-all"
              >
                {formLoading ? 'Scheduling...' : 'Authorize Flight & Layout'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2-columns: Flight List controls & Weather impact report */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weather Impact Cancel Alert report */}
          {stats && stats.weatherImpactRisk && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-indigo-400">
                <AlertTriangle className="w-5 h-5 text-indigo-400" /> Weather Interruption Risk Index
              </h3>
              
              <p className="text-slate-400 text-xs leading-relaxed">
                Calculated cancellation risk parameters based on destination precipitation indices, storm tracking, and wind speed updates.
              </p>

              <div className="divide-y divide-slate-800 text-xs">
                {stats.weatherImpactRisk.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3">
                    <span className="font-bold">{w.city}</span>
                    <div className="flex gap-4">
                      <span className="text-indigo-300 font-semibold italic">{w.alert}</span>
                      <span className={`font-black ${w.cancellationRisk.startsWith('Low') ? 'text-green-400' : 'text-amber-400'}`}>
                        {w.cancellationRisk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Flight Controls list */}
          <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass space-y-6">
            <h3 className="font-extrabold text-lg border-b border-card-border pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" /> Active Flight Operations
            </h3>

            {flights.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6 font-bold">No active scheduled flights resolved for tomorrow.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-4">
                {flights.map((flight) => (
                  <div key={flight.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
                    <div>
                      <span className="font-black text-sm block text-slate-800 dark:text-slate-200">
                        {flight.flightNumber} ({flight.origin.code} &rarr; {flight.destination.code})
                      </span>
                      <span className="text-xxs text-slate-400 font-bold block uppercase mt-0.5">
                        Status: <span className="font-extrabold text-indigo-500">{flight.status}</span> | Dep: {new Date(flight.departureTime).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(flight.id, 'DELAYED')}
                        disabled={flight.status === 'DELAYED' || flight.status === 'CANCELLED'}
                        className="px-3 py-1.5 border border-amber-500/20 text-amber-500 hover:bg-amber-500/5 text-xxs font-bold uppercase rounded-xl disabled:opacity-40"
                      >
                        Delay Flight
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(flight.id, 'CANCELLED')}
                        disabled={flight.status === 'CANCELLED'}
                        className="px-3 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/5 text-xxs font-bold uppercase rounded-xl disabled:opacity-40"
                      >
                        Cancel Flight
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
