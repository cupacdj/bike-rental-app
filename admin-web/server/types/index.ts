import { Request } from 'express';

export type BikeType = 'CITY' | 'E-BIKE' | 'MTB';
export type BikeStatus = 'available' | 'rented' | 'maintenance' | 'disabled';
export type RentalStatus = 'active' | 'finished' | 'cancelled';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'rejected';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: number;
}

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

export interface ParkingZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface Rental {
  id: string;
  userId: string;
  bikeId: string;
  status: RentalStatus;
  startAt: number;
  endAt?: number;
  totalPrice?: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startPhoto?: string;
  endPhoto?: string;
}

export interface Issue {
  id: string;
  userId: string;
  bikeId?: string;
  rentalId?: string;
  type: string;
  description: string;
  photoUrl?: string;
  status: IssueStatus;
  adminNote?: string;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface AppState {
  users: User[];
  bikes: Bike[];
  parkingZones: ParkingZone[];
  rentals: Rental[];
  notifications: Notification[];
  issues: Issue[];
  currentUserId?: string;
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: number;
}


export interface AuthenticatedRequest extends Request {
  admin?: Admin;
}


export interface EnrichedRental extends Rental {
  user: Partial<User> | null;
  bike: Bike | null;
}

export interface EnrichedIssue extends Issue {
  user: Partial<User> | null;
  bike: Bike | null;
  rental: Rental | null;
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
