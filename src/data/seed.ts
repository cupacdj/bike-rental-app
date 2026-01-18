import { AppState, Bike, ParkingZone } from '../types';

// Center: Belgrade
const BG = { lat: 44.7866, lng: 20.4489 };

function now() {
  return Date.now();
}

export const seedParkingZones: ParkingZone[] = [
  { id: 'pz_1', name: 'Trg Republike', lat: 44.8166, lng: 20.4602, radiusMeters: 180 },
  { id: 'pz_2', name: 'Kalemegdan', lat: 44.8231, lng: 20.4502, radiusMeters: 220 },
  { id: 'pz_3', name: 'Slavija', lat: 44.8025, lng: 20.4661, radiusMeters: 200 },
  { id: 'pz_4', name: 'Ušće', lat: 44.8160, lng: 20.4345, radiusMeters: 240 },
  { id: 'pz_5', name: 'Vukov spomenik', lat: 44.8047, lng: 20.4867, radiusMeters: 200 },
  { id: 'pz_bilecka', name: 'Bilećka 14', lat: 44.7732, lng: 20.4785, radiusMeters: 100 },
];

export const seedBikes: Bike[] = [
  { id: 'bike_1', label: 'BG-001', type: 'CITY', pricePerHour: 120, lat: 44.8158, lng: 20.4600, status: 'available', updatedAt: now() },
  { id: 'bike_2', label: 'BG-002', type: 'E-BIKE', pricePerHour: 220, lat: 44.8142, lng: 20.4555, status: 'available', updatedAt: now() },
  { id: 'bike_3', label: 'BG-003', type: 'MTB', pricePerHour: 160, lat: 44.8206, lng: 20.4526, status: 'available', updatedAt: now() },
  { id: 'bike_4', label: 'BG-004', type: 'CITY', pricePerHour: 120, lat: 44.8017, lng: 20.4657, status: 'available', updatedAt: now() },
  { id: 'bike_5', label: 'BG-005', type: 'CITY', pricePerHour: 120, lat: 44.8036, lng: 20.4688, status: 'available', updatedAt: now() },
  { id: 'bike_6', label: 'BG-006', type: 'E-BIKE', pricePerHour: 220, lat: 44.8150, lng: 20.4335, status: 'available', updatedAt: now() },
  { id: 'bike_7', label: 'BG-007', type: 'MTB', pricePerHour: 160, lat: 44.8165, lng: 20.4360, status: 'available', updatedAt: now() },
  { id: 'bike_8', label: 'BG-008', type: 'CITY', pricePerHour: 120, lat: 44.8050, lng: 20.4860, status: 'available', updatedAt: now() },
  { id: 'bike_9', label: 'BG-009', type: 'E-BIKE', pricePerHour: 220, lat: 44.8040, lng: 20.4900, status: 'maintenance', updatedAt: now() },
  { id: 'bike_10', label: 'BG-010', type: 'CITY', pricePerHour: 120, lat: 44.7920, lng: 20.4750, status: 'disabled', updatedAt: now() },
];

export function buildInitialState(): AppState {
  return {
    users: [],
    bikes: seedBikes,
    parkingZones: seedParkingZones,
    rentals: [],
    notifications: [],
    issues: [],
    currentUserId: undefined,
  };
}
