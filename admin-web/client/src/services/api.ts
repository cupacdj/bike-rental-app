import type { Bike, Rental, Issue, DashboardStats, ParkingZone } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || '';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      window.location.href = '/login';
    }
    throw new Error(data.error || `Error: ${response.status}`);
  }
  
  return data as T;
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return handleResponse<T>(response);
  }
};

// Specific API functions
export const bikesApi = {
  getAll: (): Promise<Bike[]> => api.get<Bike[]>('/api/admin/bikes'),
  getOne: (id: string): Promise<Bike> => api.get<Bike>(`/api/admin/bikes/${id}`),
  create: (data: Partial<Bike>): Promise<Bike> => api.post<Bike>('/api/admin/bikes', data),
  update: (id: string, data: Partial<Bike>): Promise<Bike> => api.put<Bike>(`/api/admin/bikes/${id}`, data),
  updateStatus: (id: string, status: string): Promise<Bike> => api.patch<Bike>(`/api/admin/bikes/${id}/status`, { status }),
  delete: (id: string): Promise<{ success: boolean }> => api.delete<{ success: boolean }>(`/api/admin/bikes/${id}`)
};

export const rentalsApi = {
  getAll: (): Promise<Rental[]> => api.get<Rental[]>('/api/admin/rentals'),
  getOne: (id: string): Promise<Rental> => api.get<Rental>(`/api/admin/rentals/${id}`)
};

export const issuesApi = {
  getAll: (): Promise<Issue[]> => api.get<Issue[]>('/api/admin/issues'),
  getOne: (id: string): Promise<Issue> => api.get<Issue>(`/api/admin/issues/${id}`),
  update: (id: string, data: Partial<Issue> & { bikeAction?: string }): Promise<Issue> => api.put<Issue>(`/api/admin/issues/${id}`, data)
};

export const parkingZonesApi = {
  getAll: (): Promise<ParkingZone[]> => api.get<ParkingZone[]>('/api/admin/parkingZones'),
  getOne: (id: string): Promise<ParkingZone> => api.get<ParkingZone>(`/api/admin/parkingZones/${id}`),
  create: (data: Partial<ParkingZone>): Promise<ParkingZone> => api.post<ParkingZone>('/api/admin/parkingZones', data),
  update: (id: string, data: Partial<ParkingZone>): Promise<ParkingZone> => api.put<ParkingZone>(`/api/admin/parkingZones/${id}`, data),
  delete: (id: string): Promise<{ success: boolean }> => api.delete<{ success: boolean }>(`/api/admin/parkingZones/${id}`)
};

export const statsApi = {
  getDashboard: (): Promise<DashboardStats> => api.get<DashboardStats>('/api/admin/stats')
};

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeUsernameRequest {
  newUsername: string;
  password: string;
}

export interface ChangeUsernameResponse {
  success: boolean;
  admin?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: number;
  };
}

export const profileApi = {
  changePassword: (data: ChangePasswordRequest): Promise<{ success: boolean }> => 
    api.post<{ success: boolean }>('/api/admin/change-password', data),
  changeUsername: (data: ChangeUsernameRequest): Promise<ChangeUsernameResponse> => 
    api.post<ChangeUsernameResponse>('/api/admin/change-username', data)
};
