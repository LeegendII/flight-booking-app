import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Authentication state
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('skyflow_token') : null,
  
  // Search parameters
  searchParams: {
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    cabinClass: 'ECONOMY',
    passengers: 1,
  },
  
  // Selected flights
  selectedOutbound: null,
  selectedReturn: null,
  
  // Passenger details
  passengersList: [], // { firstName, lastName, gender, passportNumber, dateOfBirth, seatNumber }
  
  // Checkout & Promo
  appliedPromo: null, // { code, discountValue, isPercentage }
  activeBookingId: null,
  activeBookingRef: null,
};

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('skyflow_token', action.payload);
        } else {
          localStorage.removeItem('skyflow_token');
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('skyflow_token');
      }
    },
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    selectOutboundFlight: (state, action) => {
      state.selectedOutbound = action.payload;
    },
    selectReturnFlight: (state, action) => {
      state.selectedReturn = action.payload;
    },
    setPassengersList: (state, action) => {
      state.passengersList = action.payload;
    },
    applyPromo: (state, action) => {
      state.appliedPromo = action.payload;
    },
    clearPromo: (state) => {
      state.appliedPromo = null;
    },
    setActiveBooking: (state, action) => {
      state.activeBookingId = action.payload.bookingId;
      state.activeBookingRef = action.payload.bookingRef;
    },
    resetBookingFlow: (state) => {
      state.selectedOutbound = null;
      state.selectedReturn = null;
      state.passengersList = [];
      state.appliedPromo = null;
      state.activeBookingId = null;
      state.activeBookingRef = null;
    },
  },
});

export const {
  setUser,
  setToken,
  logout,
  setSearchParams,
  selectOutboundFlight,
  selectReturnFlight,
  setPassengersList,
  applyPromo,
  clearPromo,
  setActiveBooking,
  resetBookingFlow,
} = bookingSlice.actions;

export default bookingSlice.reducer;
