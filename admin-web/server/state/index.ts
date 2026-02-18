import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { AppState, Admin } from '../types';


const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initialState: AppState = {
  users: [],
  bikes: [
    { id: 'bike_1', label: 'BG-001', type: 'CITY', pricePerHour: 120, lat: 44.8158, lng: 20.4600, status: 'available', updatedAt: Date.now() },
    { id: 'bike_2', label: 'BG-002', type: 'E-BIKE', pricePerHour: 220, lat: 44.8142, lng: 20.4555, status: 'available', updatedAt: Date.now() },
    { id: 'bike_3', label: 'BG-003', type: 'MTB', pricePerHour: 160, lat: 44.8206, lng: 20.4526, status: 'available', updatedAt: Date.now() },
    { id: 'bike_4', label: 'BG-004', type: 'CITY', pricePerHour: 120, lat: 44.8017, lng: 20.4657, status: 'available', updatedAt: Date.now() },
    { id: 'bike_5', label: 'BG-005', type: 'CITY', pricePerHour: 120, lat: 44.8036, lng: 20.4688, status: 'available', updatedAt: Date.now() },
    { id: 'bike_6', label: 'BG-006', type: 'E-BIKE', pricePerHour: 220, lat: 44.8150, lng: 20.4335, status: 'available', updatedAt: Date.now() },
    { id: 'bike_7', label: 'BG-007', type: 'MTB', pricePerHour: 160, lat: 44.8165, lng: 20.4360, status: 'available', updatedAt: Date.now() },
    { id: 'bike_8', label: 'BG-008', type: 'CITY', pricePerHour: 120, lat: 44.8050, lng: 20.4860, status: 'available', updatedAt: Date.now() },
    { id: 'bike_9', label: 'BG-009', type: 'E-BIKE', pricePerHour: 220, lat: 44.8040, lng: 20.4900, status: 'maintenance', updatedAt: Date.now() },
    { id: 'bike_10', label: 'BG-010', type: 'CITY', pricePerHour: 120, lat: 44.7920, lng: 20.4750, status: 'disabled', updatedAt: Date.now() },
  ],
  parkingZones: [
    { id: 'pz_1', name: 'Trg Republike', lat: 44.8166, lng: 20.4602, radiusMeters: 180, capacity: 15 },
    { id: 'pz_2', name: 'Kalemegdan', lat: 44.8231, lng: 20.4502, radiusMeters: 220, capacity: 20 },
    { id: 'pz_3', name: 'Slavija', lat: 44.8025, lng: 20.4661, radiusMeters: 200, capacity: 18 },
    { id: 'pz_4', name: 'Ušće', lat: 44.8160, lng: 20.4345, radiusMeters: 240, capacity: 25 },
    { id: 'pz_5', name: 'Vukov spomenik', lat: 44.8047, lng: 20.4867, radiusMeters: 200, capacity: 15 },
    { id: 'pz_bilecka', name: 'Bilećka 14', lat: 44.7732, lng: 20.4785, radiusMeters: 100, capacity: 8 },
  ],
  rentals: [],
  notifications: [],
  issues: [],
  currentUserId: undefined,
};

const defaultAdmins: Admin[] = [
  {
    id: 'admin_1',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    firstName: 'System',
    lastName: 'Administrator',
    createdAt: Date.now(),
  },
];


function loadState(): AppState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      const state = JSON.parse(data) as AppState;
      // Backfill capacity for zones that don't have it
      let needsSave = false;
      if (state.parkingZones) {
        for (const zone of state.parkingZones) {
          if (zone.capacity === undefined || zone.capacity === null) {
            (zone as any).capacity = 10;
            needsSave = true;
          }
        }
      }
      if (needsSave) {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      }
      return state;
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return { ...initialState };
}

function saveState(state: AppState): boolean {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving state:', error);
    return false;
  }
}

function loadAdmins(): Admin[] {
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const data = fs.readFileSync(ADMINS_FILE, 'utf8');
      return JSON.parse(data) as Admin[];
    }
  } catch (error) {
    console.error('Error loading admins:', error);
  }
  // Save default admins
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(defaultAdmins, null, 2));
  return [...defaultAdmins];
}

function saveAdmins(adminsList: Admin[]): boolean {
  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(adminsList, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving admins:', error);
    return false;
  }
}



let appState: AppState = loadState();
let admins: Admin[] = loadAdmins();

export function getAppState(): AppState {
  return appState;
}

export function setAppState(state: AppState): void {
  appState = state;
  saveState(appState);
}

export function getAdmins(): Admin[] {
  return admins;
}

export function updateAdmin(adminId: string, updates: Partial<Admin>): Admin | null {
  const index = admins.findIndex(a => a.id === adminId);
  if (index === -1) return null;
  admins[index] = { ...admins[index], ...updates };
  saveAdmins(admins);
  return admins[index];
}

export { saveState };
