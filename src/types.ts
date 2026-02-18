export type BikeStatus = 'available' | 'rented' | 'maintenance' | 'disabled';

export type BikeType = 'CITY' | 'E-BIKE' | 'MTB';

export type User = {
  id: string;
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
};

export type Bike = {
  id: string;
  label: string; // short human-friendly code
  type: BikeType;
  pricePerHour: number;
  lat: number;
  lng: number;
  status: BikeStatus;
  updatedAt: number;
};

export type ParkingZone = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  capacity: number;
};

export type Rental = {
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
  returnPhotoUri?: string; // local file path
  status: 'active' | 'finished';
};

export type AppNotification = {
  id: string;
  userId: string;
  createdAt: number;
  title: string;
  message: string;
  relatedRentalId?: string;
};

export type IssueReport = {
  id: string;
  userId: string;
  bikeId?: string;
  rentalId?: string;
  createdAt: number;
  description: string;
  photoUri: string;
};

export type AppState = {
  users: User[];
  bikes: Bike[];
  parkingZones: ParkingZone[];
  rentals: Rental[];
  notifications: AppNotification[];
  issues: IssueReport[];
  currentUserId?: string;
};
