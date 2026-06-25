'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { setPassengersList, applyPromo, clearPromo, setActiveBooking } from '../../store/bookingSlice';
import { bookingsApi, paymentsApi } from '../../services/api';
import SeatMap from '../../components/SeatMap';
import { CreditCard, Wallet, Smartphone, ShieldCheck, Tag, Trash2, Plane, Users, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, token, searchParams, selectedOutbound, selectedReturn, appliedPromo } = useSelector((state) => state.booking);

  // Return to home if no flight selected
  useEffect(() => {
    if (!selectedOutbound) {
      router.push('/');
    }
  }, [selectedOutbound, router]);

  // Total passenger count
  const totalPassengers = searchParams.passengers || 1;

  // Passenger state: array of form objects
  const [passengers, setPassengers] = useState(
    Array.from({ length: totalPassengers }).map(() => ({
      firstName: '',
      lastName: '',
      gender: 'MALE',
      passportNumber: '',
      dateOfBirth: '',
      seatNumber: '',
      returnSeatNumber: '',
    }))
  );

  // Seat selection maps
  const [selectedOutboundSeats, setSelectedOutboundSeats] = useState([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState([]);
  const [seatStep, setSeatStep] = useState(1); // 1 = outbound seats, 2 = return seats

  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Payment configuration
  const [paymentProvider, setPaymentProvider] = useState('STRIPE'); // STRIPE, PAYPAL, FLUTTERWAVE
  const [cardNumber, setCardNumber] = useState('');
  const [flwPhone, setFlwPhone] = useState('');
  const [flwNetwork, setFlwNetwork] = useState('MTN');

  // Page workflow status
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Calculate pricing metrics
  const calculatePricing = () => {
    if (!selectedOutbound) return { base: 0, markup: 0, discount: 0, tax: 0, total: 0 };
    
    // Outbound fare
    let outboundBase = selectedOutbound.basePrice;
    let outboundMarkup = 0;
    selectedOutboundSeats.forEach((seatNum) => {
      // Approximate markup based on class (visual check)
      if (seatNum.startsWith('1') || seatNum.startsWith('2')) outboundMarkup += 300;
      else if (seatNum.startsWith('3') || seatNum.startsWith('4') || seatNum.startsWith('5')) outboundMarkup += 150;
    });

    // If outbound seats not selected yet, use flat base markup
    if (selectedOutboundSeats.length === 0) {
      if (searchParams.cabinClass === 'FIRST_CLASS') outboundMarkup = 300 * totalPassengers;
      else if (searchParams.cabinClass === 'BUSINESS') outboundMarkup = 150 * totalPassengers;
    }

    // Inbound fare
    let returnBase = selectedReturn ? selectedReturn.basePrice : 0;
    let returnMarkup = 0;
    selectedReturnSeats.forEach((seatNum) => {
      if (seatNum.startsWith('1') || seatNum.startsWith('2')) returnMarkup += 300;
      else if (seatNum.startsWith('3') || seatNum.startsWith('4') || seatNum.startsWith('5')) returnMarkup += 150;
    });

    if (selectedReturn && selectedReturnSeats.length === 0) {
      if (searchParams.cabinClass === 'FIRST_CLASS') returnMarkup = 300 * totalPassengers;
      else if (searchParams.cabinClass === 'BUSINESS') returnMarkup = 150 * totalPassengers;
    }

    const baseCost = (outboundBase + returnBase) * totalPassengers;
    const markupCost = outboundMarkup + returnMarkup;
    const subtotal = baseCost + markupCost;

    // Apply promo
    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.isPercentage) {
        discount = subtotal * (appliedPromo.discountValue / 100);
      } else {
        discount = appliedPromo.discountValue;
      }
    }

    const tax = (subtotal - discount) * 0.12;
    const total = subtotal - discount + tax;

    return {
      base: baseCost,
      markup: markupCost,
      subtotal,
      discount,
      tax,
      total: Math.round(total * 100) / 100,
    };
  };

  const pricing = calculatePricing();

  // Validate Promo Code
  const handleValidatePromo = async () => {
    setPromoError('');
    setPromoSuccess('');
    try {
      const data = await bookingsApi.validatePromo(promoCodeInput);
      dispatch(applyPromo(data));
      setPromoSuccess(`Promo code applied! Saved ${data.isPercentage ? `${data.discountValue}%` : `$${data.discountValue}`}`);
    } catch (err) {
      setPromoError(err.message || 'Invalid promo code');
    }
  };

  const handleRemovePromo = () => {
    dispatch(clearPromo());
    setPromoCodeInput('');
    setPromoSuccess('');
  };

  // Form input changes
  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    
    // Auto-map seat numbers when selected
    if (field === 'seatNumber' || field === 'returnSeatNumber') {
      updated[index][field] = value;
    }
    setPassengers(updated);
  };

  // Sync selected seats into individual passenger payloads
  useEffect(() => {
    const updated = [...passengers];
    selectedOutboundSeats.forEach((seat, idx) => {
      if (updated[idx]) updated[idx].seatNumber = seat;
    });
    selectedReturnSeats.forEach((seat, idx) => {
      if (updated[idx]) updated[idx].returnSeatNumber = seat;
    });
    setPassengers(updated);
  }, [selectedOutboundSeats, selectedReturnSeats]);

  // Main Submit Booking Flow
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    // Check if seats selected
    if (selectedOutboundSeats.length < totalPassengers) {
      return setBookingError('Please select outbound seats for all passengers');
    }
    if (selectedReturn && selectedReturnSeats.length < totalPassengers) {
      return setBookingError('Please select return seats for all passengers');
    }

    // Check auth
    if (!user) {
      return setBookingError('You must sign in to finalize bookings. Please use links at the top.');
    }

    setLoading(true);

    try {
      // 1. Create Draft Booking on Backend
      const bookingPayload = {
        flightId: selectedOutbound.id,
        promoCode: appliedPromo?.code || null,
        passengers: passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender,
          passportNumber: p.passportNumber,
          dateOfBirth: p.dateOfBirth,
          seatNumber: p.seatNumber, // Outbound seat
        })),
      };

      const bookingRes = await bookingsApi.create(bookingPayload);
      
      // Save passengers list to Redux
      dispatch(setPassengersList(passengers));
      dispatch(setActiveBooking({
        bookingId: bookingRes.bookingId,
        bookingRef: bookingRes.bookingRef,
      }));

      // 2. Process simulated payment
      const transactionId = `TXN-${Math.random().toString(36).toUpperCase().substring(2, 12)}`;
      
      let paymentPayload = {
        bookingId: bookingRes.bookingId,
        transactionId,
        provider: paymentProvider,
        amount: pricing.total,
      };

      if (paymentProvider === 'STRIPE') {
        const stripeRes = await paymentsApi.createStripeIntent(bookingRes.bookingId);
        paymentPayload.transactionId = stripeRes.clientSecret.split('_secret_')[0];
      } else if (paymentProvider === 'PAYPAL') {
        const paypalRes = await paymentsApi.executePayPal(bookingRes.bookingId, `PAY-PAL-ORDER-${Math.floor(Math.random()*10000)}`);
        paymentPayload.transactionId = paypalRes.transactionId;
      } else if (paymentProvider === 'FLUTTERWAVE') {
        const flwRes = await paymentsApi.chargeFlutterwave({
          bookingId: bookingRes.bookingId,
          email: user.email,
          phoneNumber: flwPhone,
          network: flwNetwork,
        });
        paymentPayload.transactionId = flwRes.data.flw_ref;
      }

      // 3. Confirm Booking
      await bookingsApi.confirm(paymentPayload);

      // 4. Redirect to Confirmation page
      router.push('/confirmation');

    } catch (err) {
      console.error(err);
      setBookingError(err.message || 'Payment capture failed. Seat lock released.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOutbound) return null;

  return (
    <div className="space-y-8">
      {/* Checkout step indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-card-border pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Checkout Passenger details & Seats</h2>
          <p className="text-sm text-slate-400">Review flight details, reserve aircraft seating, and execute secure billing.</p>
        </div>
      </div>

      {bookingError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
          <span>{bookingError}</span>
        </div>
      )}

      {/* Main double column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2-columns: Forms & Seat Maps */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Outbound/Inbound Flight details summary */}
          <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass space-y-4">
            <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plane className="w-5 h-5 text-indigo-500 rotate-45" /> Flight Selection Details
            </h3>

            {/* Outbound segment */}
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="font-extrabold block">Outbound Flight: {selectedOutbound.flightNumber}</span>
                <span className="text-xs text-slate-400 font-semibold">
                  {selectedOutbound.origin.city} ({selectedOutbound.origin.code}) to {selectedOutbound.destination.city} ({selectedOutbound.destination.code})
                </span>
              </div>
              <span className="font-black text-brand-primary">USD {selectedOutbound.price} / pax</span>
            </div>

            {/* Return segment (optional) */}
            {selectedReturn && (
              <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <span className="font-extrabold block">Return Flight: {selectedReturn.flightNumber}</span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {selectedReturn.origin.city} ({selectedReturn.origin.code}) to {selectedReturn.destination.city} ({selectedReturn.destination.code})
                  </span>
                </div>
                <span className="font-black text-brand-primary">USD {selectedReturn.price} / pax</span>
              </div>
            )}
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-8">
            
            {/* Passenger Forms */}
            <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Users className="w-5 h-5 text-brand-primary" /> Passengers Bio Data
              </h3>

              {passengers.map((p, idx) => (
                <div key={idx} className="space-y-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 pb-6 last:pb-0">
                  <h4 className="text-sm font-bold text-brand-primary">Passenger #{idx + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                      <input
                        type="text"
                        required
                        value={p.firstName}
                        onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                        placeholder="John"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        value={p.lastName}
                        onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold"
                      />
                    </div>

                    {/* Date of birth */}
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={p.dateOfBirth}
                        onChange={(e) => handlePassengerChange(idx, 'dateOfBirth', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2 px-4 text-sm font-semibold"
                      />
                    </div>

                    {/* Passport */}
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Passport Number</label>
                      <input
                        type="text"
                        required
                        value={p.passportNumber}
                        onChange={(e) => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                        placeholder="A00000000"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Seat Selection Panel */}
            <div className="space-y-6">
              <div className="flex gap-4 border-b border-card-border pb-4">
                <button
                  type="button"
                  onClick={() => setSeatStep(1)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                    seatStep === 1
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Outbound Seats ({selectedOutboundSeats.length}/{totalPassengers})
                </button>
                {selectedReturn && (
                  <button
                    type="button"
                    onClick={() => setSeatStep(2)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                      seatStep === 2
                        ? 'bg-brand-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Return Seats ({selectedReturnSeats.length}/{totalPassengers})
                  </button>
                )}
              </div>

              {seatStep === 1 ? (
                <SeatMap
                  flightId={selectedOutbound.id}
                  totalPassengers={totalPassengers}
                  selectedSeats={selectedOutboundSeats}
                  onSelectSeats={setSelectedOutboundSeats}
                />
              ) : (
                selectedReturn && (
                  <SeatMap
                    flightId={selectedReturn.id}
                    totalPassengers={totalPassengers}
                    selectedSeats={selectedReturnSeats}
                    onSelectSeats={setSelectedReturnSeats}
                  />
                )
              )}
            </div>

            {/* Checkout Billing & Payment */}
            <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CreditCard className="w-5 h-5 text-brand-primary" /> Billing Information & Gateways
              </h3>

              {/* Providers tab buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentProvider('STRIPE')}
                  className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentProvider === 'STRIPE'
                      ? 'border-brand-primary bg-indigo-500/5 text-brand-primary font-bold'
                      : 'border-card-border hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[10px] uppercase tracking-wide">Stripe Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentProvider('PAYPAL')}
                  className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentProvider === 'PAYPAL'
                      ? 'border-brand-primary bg-indigo-500/5 text-brand-primary font-bold'
                      : 'border-card-border hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="text-[10px] uppercase tracking-wide">PayPal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentProvider('FLUTTERWAVE')}
                  className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentProvider === 'FLUTTERWAVE'
                      ? 'border-brand-primary bg-indigo-500/5 text-brand-primary font-bold'
                      : 'border-card-border hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[10px] uppercase tracking-wide">Flutterwave</span>
                </button>
              </div>

              {/* Provider details fields */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {paymentProvider === 'STRIPE' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Simulated Stripe Element Card</span>
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 mb-2">Credit Card Number</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g,'').substring(0,16))}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full bg-card border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {paymentProvider === 'PAYPAL' && (
                  <div className="space-y-2 text-center py-4">
                    <span className="text-xs font-semibold text-slate-500">PayPal Checkout Integration Active</span>
                    <p className="text-xxs text-slate-400">Clicking Pay will securely execute the PayPal Wallet authorization flow.</p>
                  </div>
                )}

                {paymentProvider === 'FLUTTERWAVE' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">African Mobile Money Payments</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xxs font-bold text-slate-400 mb-2">Mobile Operator Network</label>
                        <select
                          value={flwNetwork}
                          onChange={(e) => setFlwNetwork(e.target.value)}
                          className="w-full bg-card border border-card-border rounded-2xl py-2 px-4 text-sm font-semibold"
                        >
                          <option value="MTN">MTN Mobile Money</option>
                          <option value="AIRTEL">Airtel Money</option>
                          <option value="ORANGE">Orange Money</option>
                          <option value="MPESA">M-Pesa Safaricom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xxs font-bold text-slate-400 mb-2">Registered Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={flwPhone}
                          onChange={(e) => setFlwPhone(e.target.value)}
                          placeholder="+234 803 123 4567"
                          className="w-full bg-card border border-card-border rounded-2xl py-2.5 px-4 text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit payment trigger */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-xl shadow-green-600/10 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{loading ? 'Processing payment...' : `Authorize & Pay USD ${pricing.total.toFixed(2)}`}</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right column: Invoice breakdown summary */}
        <div className="bg-card border border-card-border rounded-3xl p-6 shadow-sm glass space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            Invoice Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span>Base Ticket Price</span>
              <span>USD {pricing.base.toFixed(2)}</span>
            </div>

            {pricing.markup > 0 && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Seat Class Markups</span>
                <span>USD {pricing.markup.toFixed(2)}</span>
              </div>
            )}

            {appliedPromo && (
              <div className="flex justify-between items-center text-green-500 font-semibold">
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Promo ({appliedPromo.code})</span>
                <span>- USD {pricing.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-500">
              <span>Taxes & Fees (12%)</span>
              <span>USD {pricing.tax.toFixed(2)}</span>
            </div>

            <hr className="border-card-border" />

            <div className="flex justify-between items-center text-base font-extrabold">
              <span>Grand Total</span>
              <span className="text-lg text-brand-primary">USD {pricing.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Promo code fields */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Promo Code Support</label>
            
            {appliedPromo ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Code {appliedPromo.code} Active</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. FLY20"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-card-border rounded-xl px-3 py-1.5 text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleValidatePromo}
                  className="px-4 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl"
                >
                  Apply
                </button>
              </div>
            )}

            {promoError && <span className="text-xxs text-red-500 font-bold block">{promoError}</span>}
            {promoSuccess && <span className="text-xxs text-green-500 font-bold block">{promoSuccess}</span>}
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 border border-card-border rounded-2xl text-xxs text-slate-400 space-y-2 leading-relaxed">
            <span className="font-extrabold text-slate-500 block">Terms & Conditions:</span>
            <p>1. Payments are protected and processed in test sandboxes.</p>
            <p>2. Flight cancellations are refundable from your user profile history dashboard.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
