const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Core fetch helper mapping JSON options and auth headers
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('skyflow_token') : null);
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check if empty response or download payload
    if (endpoint.endsWith('/pdf')) {
      return response;
    }

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'Network request failed');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      console.warn(`API Auth Error [${method} ${endpoint}]:`, error.message);
    } else {
      console.error(`API Error [${method} ${endpoint}]:`, error.message);
    }
    throw error;
  }
}

// Authentication API methods
export const authApi = {
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  register: (email, password, fullName) => apiRequest('/auth/register', 'POST', { email, password, fullName }),
  googleAuth: (email, fullName, googleId, profilePic) => apiRequest('/auth/google', 'POST', { email, fullName, googleId, profilePic }),
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (profileData) => apiRequest('/auth/profile', 'PUT', profileData),
  getPassengers: () => apiRequest('/auth/passengers'),
  addPassenger: (passenger) => apiRequest('/auth/passengers', 'POST', passenger),
  deletePassenger: (id) => apiRequest(`/auth/passengers/${id}`, 'DELETE'),
};

// Flights API methods
export const flightsApi = {
  getAirports: () => apiRequest('/flights/airports'),
  getAirlines: () => apiRequest('/flights/airlines'),
  search: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/flights/search?${query}`);
  },
  getSeats: (flightId) => apiRequest(`/flights/${flightId}/seats`),
};

// Weather API methods
export const weatherApi = {
  getWeather: (city) => apiRequest(`/weather?city=${encodeURIComponent(city)}`),
};

// Bookings API methods
export const bookingsApi = {
  create: (bookingData) => apiRequest('/bookings', 'POST', bookingData),
  confirm: (confirmData) => apiRequest('/bookings/confirm', 'POST', confirmData),
  validatePromo: (code) => apiRequest('/bookings/promo/validate', 'POST', { code }),
  getHistory: () => apiRequest('/bookings/history'),
  getDetails: (id) => apiRequest(`/bookings/${id}`),
  cancel: (id) => apiRequest(`/bookings/${id}/cancel`, 'POST'),
  downloadPdfUrl: (id) => `${API_BASE_URL}/bookings/${id}/pdf`,
};

// Payments API methods
export const paymentsApi = {
  createStripeIntent: (bookingId) => apiRequest('/payments/stripe/intent', 'POST', { bookingId }),
  executePayPal: (bookingId, paypalOrderId) => apiRequest('/payments/paypal/execute', 'POST', { bookingId, paypalOrderId }),
  chargeFlutterwave: (payload) => apiRequest('/payments/flutterwave/charge', 'POST', payload),
};

// Admin API methods
export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),
  createFlight: (flightData) => apiRequest('/admin/flights', 'POST', flightData),
  updateFlightStatus: (id, statusData) => apiRequest(`/admin/flights/${id}/status`, 'PUT', statusData),
};
