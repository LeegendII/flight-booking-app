'use client';

import { useState, useEffect } from 'react';
import { flightsApi } from '../services/api';
import { Armchair, ChevronRight } from 'lucide-react';

export default function SeatMap({ flightId, totalPassengers, selectedSeats, onSelectSeats }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch flight seat layout
  useEffect(() => {
    async function fetchSeats() {
      setLoading(true);
      setError('');
      try {
        const data = await flightsApi.getSeats(flightId);
        setSeats(data.seats);
      } catch (err) {
        console.error('Failed to load seats:', err);
        setError('Could not retrieve seat configuration for this flight.');
      } finally {
        setLoading(false);
      }
    }
    if (flightId) fetchSeats();
  }, [flightId]);

  // Handle seat click
  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;

    const isSelected = selectedSeats.includes(seat.seatNumber);
    let updatedSelection = [];

    if (isSelected) {
      updatedSelection = selectedSeats.filter((num) => num !== seat.seatNumber);
    } else {
      if (selectedSeats.length >= totalPassengers) {
        // Replace first selected seat if passenger limit exceeded
        updatedSelection = [...selectedSeats.slice(1), seat.seatNumber];
      } else {
        updatedSelection = [...selectedSeats, seat.seatNumber];
      }
    }

    onSelectSeats(updatedSelection);
  };

  // Get seat styling based on class and occupancy
  const getSeatClass = (seat) => {
    const isSelected = selectedSeats.includes(seat.seatNumber);
    if (seat.isBooked) {
      return 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed';
    }
    if (isSelected) {
      return 'bg-green-500 text-white border-green-600 scale-[1.05] shadow-lg shadow-green-500/20';
    }
    switch (seat.class) {
      case 'FIRST_CLASS':
        return 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/50';
      case 'BUSINESS':
        return 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:border-purple-900/50';
      default:
        return 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-300 dark:bg-sky-950/30 dark:border-sky-900/50';
    }
  };

  // Group seats by rows
  const rows = {};
  seats.forEach((seat) => {
    // Extract row number (matches digits)
    const match = seat.seatNumber.match(/^(\d+)/);
    if (match) {
      const rowNum = match[1];
      if (!rows[rowNum]) rows[rowNum] = [];
      rows[rowNum].push(seat);
    }
  });

  // Sort seats in each row alphabetically
  Object.keys(rows).forEach((row) => {
    rows[row].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
  });

  return (
    <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="font-extrabold text-lg">Aircraft Seat Layout Map</h3>
        <p className="text-slate-400 text-xs mt-1">
          Select <span className="text-brand-primary font-bold">{totalPassengers} seat(s)</span> for your trip.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs font-semibold mb-8 border-b border-card-border pb-6 w-full">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/50 flex items-center justify-center text-amber-600">
            <Armchair className="w-3.5 h-3.5" />
          </div>
          <span>First Class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-900/50 flex items-center justify-center text-purple-600">
            <Armchair className="w-3.5 h-3.5" />
          </div>
          <span>Business</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-sky-100 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-900/50 flex items-center justify-center text-sky-600">
            <Armchair className="w-3.5 h-3.5" />
          </div>
          <span>Economy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-green-500 border border-green-600 flex items-center justify-center text-white">
            <Armchair className="w-3.5 h-3.5" />
          </div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
            <Armchair className="w-3.5 h-3.5" />
          </div>
          <span>Booked</span>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-primary animate-spin"></div>
          <span className="text-xs text-slate-400 font-bold">Scanning seat configurations...</span>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-10 text-sm font-semibold">{error}</div>
      ) : (
        /* Airplane Fuselage container */
        <div className="w-full max-w-sm border-2 border-slate-300 dark:border-slate-800 rounded-t-[100px] border-b-8 p-6 pt-16 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center">
          
          {/* Flight cabin nose cone label */}
          <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-10 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full bg-white dark:bg-slate-900 shadow-sm">
            Flight Deck Ahead
          </div>

          <div className="w-full space-y-4">
            {Object.entries(rows).map(([rowNum, rowSeats]) => (
              <div key={rowNum} className="flex items-center justify-between gap-1 w-full">
                
                {/* Row label left */}
                <div className="w-5 text-xxs font-black text-slate-400 text-center">{rowNum}</div>

                {/* Left side seats (first half of alphabet e.g. A, B, C) */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {rowSeats.slice(0, Math.ceil(rowSeats.length / 2)).map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.isBooked}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${getSeatClass(seat)}`}
                      title={`${seat.seatNumber} (${seat.class.replace('_', ' ')}) ${seat.isBooked ? '- Booked' : ''}`}
                    >
                      <span className="text-xxs font-bold">{seat.seatNumber}</span>
                    </button>
                  ))}
                </div>

                {/* Aisle */}
                <div className="w-6 flex items-center justify-center">
                  <div className="h-9 w-[2px] bg-slate-200 dark:bg-slate-800"></div>
                </div>

                {/* Right side seats (second half of alphabet e.g. D, E, F) */}
                <div className="flex items-center gap-2 flex-1 justify-start">
                  {rowSeats.slice(Math.ceil(rowSeats.length / 2)).map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.isBooked}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${getSeatClass(seat)}`}
                      title={`${seat.seatNumber} (${seat.class.replace('_', ' ')}) ${seat.isBooked ? '- Booked' : ''}`}
                    >
                      <span className="text-xxs font-bold">{seat.seatNumber}</span>
                    </button>
                  ))}
                </div>

                {/* Row label right */}
                <div className="w-5 text-xxs font-black text-slate-400 text-center">{rowNum}</div>

              </div>
            ))}
          </div>

          {/* Airplane tail notice */}
          <div className="w-full text-center border-t border-slate-200 dark:border-slate-800 mt-10 pt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Galley & Restrooms
          </div>
        </div>
      )}

      {/* Selected summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-8 text-center space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Selected Seats</span>
          <div className="flex gap-2 justify-center mt-1">
            {selectedSeats.map((s) => (
              <span key={s} className="px-3 py-1 bg-green-500 text-white font-extrabold text-sm rounded-xl shadow-md shadow-green-500/10">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
