'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { bookingsApi } from '../../services/api';
import Link from 'next/link';
import { History, Plane, Download, Trash2, Calendar, Users, Info, ShieldAlert } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.booking);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states for cancellation confirmation
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  // Fetch history list
  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingsApi.getHistory();
      setBookings(data);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Could not retrieve booking transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadBookings();
  }, [token]);

  // Handle Cancellation API trigger
  const handleCancelBooking = async () => {
    if (!cancellingId) return;
    setCancelLoading(true);
    try {
      await bookingsApi.cancel(cancellingId);
      // Reload history
      await loadBookings();
      setCancellingId(null);
    } catch (err) {
      alert(err.message || 'Cancellation request failed');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xxs font-extrabold uppercase rounded-full">Confirmed</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xxs font-extrabold uppercase rounded-full">Pending Payment</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-xxs font-extrabold uppercase rounded-full">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-500/10 text-slate-500 text-xxs font-extrabold uppercase rounded-full">{status}</span>;
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-primary animate-spin"></div>
        <span className="text-xs text-slate-400 font-bold">Scanning booking logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <History className="w-8 h-8 text-brand-primary" /> My Booking History
        </h2>
        <p className="text-sm text-slate-400">Review your past flights, check-in options, and download invoices.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-2xl">
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-card border border-card-border rounded-3xl p-12 text-center shadow-sm glass">
          <Plane className="w-12 h-12 text-slate-300 mx-auto rotate-45 mb-4" />
          <h3 className="text-lg font-bold">No Flights Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            You don&apos;t have any reservation records logged. Start looking for flights from the homepage.
          </p>
          <Link href="/" className="inline-block mt-4 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all">
            Find Flights
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card border border-card-border rounded-3xl p-6 shadow-sm hover-card-trigger relative overflow-hidden flex flex-col gap-6"
            >
              {/* Header row */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-400">PNR:</span>
                  <span className="font-extrabold text-sm tracking-wider text-slate-800 dark:text-slate-200">{booking.bookingRef}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(booking.status)}
                </div>
              </div>

              {/* Core Flight layout */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Airline & Times */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-card-border flex-shrink-0">
                    <Plane className="w-5 h-5 text-slate-400 rotate-45" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      {booking.flight.departureAirportId} &rarr; {booking.flight.arrivalAirportId}
                    </h4>
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">
                      {booking.flight.flightNumber} | {new Date(booking.flight.departureTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Departs: {new Date(booking.flight.departureTime).toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit', hour12:false})}</span>
                </div>

                {/* Price paid */}
                <div className="text-left md:text-right">
                  <span className="text-xxs font-bold text-slate-400 block uppercase">Grand Total Paid</span>
                  <span className="text-lg font-black text-brand-primary">USD {booking.totalFare.toFixed(2)}</span>
                </div>

              </div>

              {/* Passenger seat details */}
              <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-xs space-y-2">
                <span className="text-slate-400 font-bold block">Boarding Passenger Seats</span>
                {booking.passengers.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{p.firstName} {p.lastName}</span>
                    <span className="font-bold text-slate-500">Seat {p.seatNumber}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                {/* Download ticket */}
                <a
                  href={bookingsApi.downloadPdfUrl(booking.id)}
                  download
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Get Ticket</span>
                </a>

                {/* Refund cancel */}
                {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                  <button
                    onClick={() => setCancellingId(booking.id)}
                    className="w-full sm:w-auto px-4 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/5 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 sm:ml-auto transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel & Refund</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Dialog modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-card-border rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-500 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-black text-lg">Confirm Cancellation</h3>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed">
              Are you sure you want to cancel this flight reservation? This action is immediate, will release your seats back to the aircraft grid, and process a simulated invoice refund to your payment provider.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancellingId(null)}
                disabled={cancelLoading}
                className="flex-1 py-2.5 border border-card-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/10 disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
