const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get headers with JWT token
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('marketsmaps_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// API Wrapper
const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(err.message || 'Error en la petición');
    }
    return response.json();
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(err.message || 'Error en la petición');
    }
    return response.json();
  },

  async put(endpoint: string, body: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(err.message || 'Error en la petición');
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(err.message || 'Error en la petición');
    }
    return response.json();
  }
};

// Auth Service
export const authService = {
  async signup(data: any) {
    const res = await api.post('/auth/signup', data);
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('marketsmaps_token', res.token);
    }
    return res;
  },

  async login(credentials: any) {
    const res = await api.post('/auth/login', credentials);
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('marketsmaps_token', res.token);
    }
    return res;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marketsmaps_token');
    }
  }
};

// Users Service
export const userService = {
  async getProfile(userId: string) {
    return api.get(`/users/${userId}`);
  },

  async updateProfile(userId: string, data: any) {
    return api.put(`/users/${userId}`, data);
  }
};

// Products Service
export const productService = {
  async getProducts() {
    return api.get('/products');
  },

  async createProduct(data: any) {
    return api.post('/products', data);
  },

  async deleteProduct(id: string) {
    return api.delete(`/products/${id}`);
  }
};

// Locations Service
export const locationService = {
  async updateLocation(data: { lng: number; lat: number; accuracy?: number }) {
    return api.post('/locations', data);
  },

  async getNearbySellers(params: { lat: number; lng: number; maxDistance: number }) {
    const query = `?lat=${params.lat}&lng=${params.lng}&maxDistance=${params.maxDistance}`;
    return api.get(`/locations/nearby${query}`);
  }
};

// Chats & Messaging Service
export const chatService = {
  async getChats() {
    return api.get('/chats');
  },

  async getMessages(chatId: string) {
    return api.get(`/chats/${chatId}/messages`);
  },

  async createChat(storeId: string) {
    return api.post('/chats', { storeId });
  }
};

// Orders Service
export const orderService = {
  async createOrder(data: any) {
    return api.post('/orders', data);
  },

  async getOrders() {
    return api.get('/orders');
  }
};
