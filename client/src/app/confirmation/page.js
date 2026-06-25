'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { resetBookingFlow } from '../../store/bookingSlice';
import { bookingsApi } from '../../services/api';
import Link from 'next/link';
import { Check, Download, History, Plane, Users, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ConfirmationPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { activeBookingId, activeBookingRef } = useSelector((state) => state.booking);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch confirmation details
  useEffect(() => {
    if (!activeBookingId) {
      // If refreshed or empty, do not crash but redirect or prompt history check
      setLoading(false);
      return;
    }

    async function loadBooking() {
      try {
        const data = await bookingsApi.getDetails(activeBookingId);
        setBooking(data);
      } catch (err) {
        console.error('Error confirmation detail load:', err);
        setError('Failed to load transaction invoice.');
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [activeBookingId]);

  // Clean up selection states on unmount
  useEffect(() => {
    return () => {
      // Reset checkout options so next booking starts fresh
      dispatch(resetBookingFlow());
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-primary animate-spin"></div>
        <span className="text-sm text-slate-400 font-bold">Compiling your ticket invoice...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center">
          <Plane className="w-8 h-8 rotate-180" />
        </div>
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          If you have completed your payment, please verify your transaction under the booking history panels.
        </p>
        <Link href="/" className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl">
          Return Home
        </Link>
      </div>
    );
  }

  // QR Code creation string (PNR verification check-in)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(booking.qrToken || 'SKYFLOW-BOARDING-PASS')}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Success banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-3xl p-8 shadow-xl text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 bg-white/10 border border-white/20 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">Booking Successfully Confirmed!</h2>
        <p className="text-emerald-100 text-sm max-w-md mx-auto">
          Your payment has been cleared. E-tickets have been sent to <span className="font-bold">{booking.user?.email || 'your email'}</span>.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/10 rounded-2xl border border-white/10 text-sm font-black">
          <span>Booking PNR:</span>
          <span className="tracking-widest">{booking.bookingRef}</span>
        </div>
      </div>

      {/* Main card grid splits details & Boarding QR Pass */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Ticket details column */}
        <div className="md:col-span-2 bg-card border border-card-border rounded-3xl p-6 shadow-sm glass space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-500 rotate-45" /> Boarding Pass Info
          </h3>

          {/* Flights list */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
              <span>Flight Details</span>
              <span>Status: {booking.flight.status}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-black text-lg block">{booking.flight.departureAirportId}</span>
                <span className="text-xxs text-slate-400 font-semibold block">{booking.flight.departureAirport.city}</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-xxs text-slate-400 font-bold uppercase">
                  {Math.floor(booking.flight.durationMinutes / 60)}h {booking.flight.durationMinutes % 60}m
                </span>
                <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-800 my-1 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500">
                    <Plane className="w-3.5 h-3.5 rotate-45" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-lg block">{booking.flight.arrivalAirportId}</span>
                <span className="text-xxs text-slate-400 font-semibold block">{booking.flight.arrivalAirport.city}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-bold block">Departure Date</span>
                <span className="font-bold">{new Date(booking.flight.departureTime).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Flight Number</span>
                <span className="font-bold">{booking.flight.flightNumber}</span>
              </div>
            </div>
          </div>

          {/* Passengers seats details */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passengers & Seats</h4>
            
            <div className="space-y-3">
              {booking.passengers.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">{p.firstName} {p.lastName}</span>
                  </div>
                  <div className="px-3 py-1 bg-brand-primary/15 border border-brand-primary/25 rounded-xl text-brand-primary text-xs font-black">
                    Seat {p.seatNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Boarding pass QR column */}
        <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass text-center space-y-6 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">QR Check-In Code</span>
          
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
            <img src={qrCodeUrl} alt="Boarding Checkin QR Pass" className="w-40 h-40 object-cover" />
          </div>

          <p className="text-xxs text-slate-400 leading-relaxed px-4">
            Present this QR Code directly to the counter gate staff to instantly load your luggage and boarding pass.
          </p>

          <div className="w-full space-y-3 pt-4 border-t border-card-border">
            {/* Download e-Ticket button */}
            <a
              href={bookingsApi.downloadPdfUrl(booking.id)}
              download
              className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-extrabold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download e-Ticket</span>
            </a>

            <Link
              href="/history"
              className="w-full py-2.5 border border-card-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>My Bookings</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
