// Types for admin web application

export interface Admin {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  createdAt?: number;
}

export type BikeType = 'CITY' | 'E-BIKE' | 'MTB';
export type BikeStatus = 'available' | 'rented' | 'maintenance' | 'disabled';

export interface Bike {
  id: string;
  label: string;
  type: BikeType;
  pricePerHour: number;
  lat: number;
  lng: number;
  status: BikeStatus;
  updatedAt: number;
}

export type RentalStatus = 'active' | 'finished';

export interface Rental {
  id: string;
  userId: string;
  bikeId: string;
  startAt: number;
  endAt?: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  totalPrice?: number;
  returnPhotoUri?: string;
  status: RentalStatus;
  user?: User | null;
  bike?: Bike | null;
}

export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'rejected';

export interface Issue {
  id: string;
  userId: string;
  bikeId?: string;
  rentalId?: string;
  description: string;
  photoUri?: string;
  createdAt: number;
  status?: IssueStatus;
  adminNote?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  user?: User | null;
  bike?: Bike | null;
  rental?: Rental | null;
}

export interface DashboardStats {
  bikes: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    disabled: number;
  };
  rentals: {
    total: number;
    active: number;
    finished: number;
    revenue: number;
  };
  users: {
    total: number;
  };
  issues: {
    total: number;
    open: number;
  };
}

export interface ParkingZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface LoginResponse {
  success: boolean;
  admin?: Admin;
  token?: string;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

// Form types
export interface BikeFormData {
  label: string;
  type: BikeType;
  pricePerHour: string;
  lat: string;
  lng: string;
  status: BikeStatus;
}

export interface BikeFormErrors {
  label?: string;
  pricePerHour?: string;
  lat?: string;
  lng?: string;
}

export interface ParkingZoneFormData {
  name: string;
  lat: string;
  lng: string;
  radiusMeters: string;
}

export interface ParkingZoneFormErrors {
  name?: string;
  lat?: string;
  lng?: string;
  radiusMeters?: string;
}

// Component prop types
export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Auth context types
export interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAdminInfo: (admin: Admin) => void;
}

export interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

// Bike constants types
export interface BikeTypeInfo {
  value: BikeType;
  label: string;
  color: string;
}

export interface BikeStatusInfo {
  value: BikeStatus;
  label: string;
  color: string;
  icon: React.ComponentType<{ size?: number }>;
}

export interface IssueStatusInfo {
  value: IssueStatus;
  label: string;
  color: string;
  icon: React.ComponentType<{ size?: number }>;
}
