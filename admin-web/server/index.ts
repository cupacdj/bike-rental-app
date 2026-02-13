import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPE DEFINITIONS ====================

type BikeType = 'CITY' | 'E-BIKE' | 'MTB';
type BikeStatus = 'available' | 'rented' | 'maintenance' | 'disabled';
type RentalStatus = 'active' | 'finished' | 'cancelled';
type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'rejected';

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: number;
}

interface Bike {
  id: string;
  label: string;
  type: BikeType;
  pricePerHour: number;
  lat: number;
  lng: number;
  status: BikeStatus;
  updatedAt: number;
}

interface ParkingZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

interface Rental {
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

interface Issue {
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

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

interface AppState {
  users: User[];
  bikes: Bike[];
  parkingZones: ParkingZone[];
  rentals: Rental[];
  notifications: Notification[];
  issues: Issue[];
  currentUserId?: string;
}

interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: number;
}

interface AuthenticatedRequest extends Request {
  admin?: Admin;
}

// ==================== APP SETUP ====================

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state structure
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
    { id: 'pz_1', name: 'Trg Republike', lat: 44.8166, lng: 20.4602, radiusMeters: 180 },
    { id: 'pz_2', name: 'Kalemegdan', lat: 44.8231, lng: 20.4502, radiusMeters: 220 },
    { id: 'pz_3', name: 'Slavija', lat: 44.8025, lng: 20.4661, radiusMeters: 200 },
    { id: 'pz_4', name: 'Ušće', lat: 44.8160, lng: 20.4345, radiusMeters: 240 },
    { id: 'pz_5', name: 'Vukov spomenik', lat: 44.8047, lng: 20.4867, radiusMeters: 200 },
    { id: 'pz_bilecka', name: 'Bilećka 14', lat: 44.7732, lng: 20.4785, radiusMeters: 100 },
  ],
  rentals: [],
  notifications: [],
  issues: [],
  currentUserId: undefined,
};

// Default admin accounts
const defaultAdmins: Admin[] = [
  {
    id: 'admin_1',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    firstName: 'System',
    lastName: 'Administrator',
    createdAt: Date.now()
  }
];

// ==================== STATE MANAGEMENT ====================

function loadState(): AppState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data) as AppState;
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

// Initialize data
let appState: AppState = loadState();
let admins: Admin[] = loadAdmins();

// ==================== MULTER CONFIGURATION ====================

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Default to 'general' - we'll move the file after upload if needed
    const kindDir = path.join(uploadsDir, 'uploads');
    if (!fs.existsSync(kindDir)) {
      fs.mkdirSync(kindDir, { recursive: true });
    }
    cb(null, kindDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ==================== AUTH MIDDLEWARE ====================

function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Neautorizovan pristup.' });
    return;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [adminId] = decoded.split(':');
    const admin = admins.find(a => a.id === adminId);
    if (!admin) {
      res.status(401).json({ error: 'Nevalidan token.' });
      return;
    }
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Nevalidan token.' });
  }
}

// ==================== AUTH ROUTES ====================

app.post('/api/admin/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Korisničko ime i lozinka su obavezni.' });
    return;
  }

  const admin = admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (!admin) {
    res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka.' });
    return;
  }

  const isValid = bcrypt.compareSync(password, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka.' });
    return;
  }

  // Return admin info (without password)
  const { passwordHash, ...adminInfo } = admin;
  res.json({ 
    success: true, 
    admin: adminInfo,
    token: Buffer.from(`${admin.id}:${Date.now()}`).toString('base64')
  });
});

// Change password
app.post('/api/admin/change-password', verifyAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Trenutna i nova lozinka su obavezne.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Nova lozinka mora imati najmanje 6 karaktera.' });
    return;
  }

  const admin = req.admin;
  if (!admin) {
    res.status(401).json({ error: 'Neautorizovan pristup.' });
    return;
  }

  // Verify current password
  const isValid = bcrypt.compareSync(currentPassword, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Trenutna lozinka nije ispravna.' });
    return;
  }

  // Update password
  const adminIndex = admins.findIndex(a => a.id === admin.id);
  if (adminIndex === -1) {
    res.status(404).json({ error: 'Administrator nije pronađen.' });
    return;
  }

  admins[adminIndex].passwordHash = bcrypt.hashSync(newPassword, 10);
  saveAdmins(admins);

  res.json({ success: true });
});

// Change username
app.post('/api/admin/change-username', verifyAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { newUsername, password } = req.body as { newUsername?: string; password?: string };

  if (!newUsername || !password) {
    res.status(400).json({ error: 'Novo korisničko ime i lozinka su obavezni.' });
    return;
  }

  if (newUsername.length < 3) {
    res.status(400).json({ error: 'Korisničko ime mora imati najmanje 3 karaktera.' });
    return;
  }

  const admin = req.admin;
  if (!admin) {
    res.status(401).json({ error: 'Neautorizovan pristup.' });
    return;
  }

  // Verify password
  const isValid = bcrypt.compareSync(password, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Lozinka nije ispravna.' });
    return;
  }

  // Check if username already exists (case-insensitive)
  const existingAdmin = admins.find(
    a => a.username.toLowerCase() === newUsername.toLowerCase() && a.id !== admin.id
  );
  if (existingAdmin) {
    res.status(400).json({ error: 'Korisničko ime je već zauzeto.' });
    return;
  }

  // Update username
  const adminIndex = admins.findIndex(a => a.id === admin.id);
  if (adminIndex === -1) {
    res.status(404).json({ error: 'Administrator nije pronađen.' });
    return;
  }

  admins[adminIndex].username = newUsername;
  saveAdmins(admins);

  // Return updated admin info
  const { passwordHash, ...adminInfo } = admins[adminIndex];
  res.json({ success: true, admin: adminInfo });
});

// ==================== STATE SYNC ROUTES (for mobile app) ====================

app.get('/api/state', (req: Request, res: Response): void => {
  res.json(appState);
});

app.put('/api/state', (req: Request, res: Response): void => {
  const newState = req.body as AppState;
  if (!newState) {
    res.status(400).json({ error: 'Invalid state' });
    return;
  }
  appState = newState;
  saveState(appState);
  res.json({ success: true });
});

app.post('/api/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  
  const kind = (req.body as { kind?: string }).kind || 'general';
  
  // Move file to correct kind directory
  const kindDir = path.join(uploadsDir, kind);
  if (!fs.existsSync(kindDir)) {
    fs.mkdirSync(kindDir, { recursive: true });
  }
  
  const newPath = path.join(kindDir, req.file.filename);
  try {
    fs.renameSync(req.file.path, newPath);
  } catch (e) {
    // If rename fails (cross-device), copy and delete
    fs.copyFileSync(req.file.path, newPath);
    fs.unlinkSync(req.file.path);
  }
  
  // Build URL - use the request host or fallback
  const host = req.headers.host || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const url = `${protocol}://${host}/uploads/${kind}/${req.file.filename}`;
  
  console.log('[Upload] File saved:', url);
  res.json({ url });
});

// ==================== PUBLIC BIKE ROUTES ====================

// Update bike location (called when bike is returned after rental)
app.patch('/api/bikes/:id/location', (req: Request, res: Response): void => {
  const bikeIndex = appState.bikes.findIndex(b => b.id === req.params.id);
  if (bikeIndex === -1) {
    res.status(404).json({ error: 'Bike not found.' });
    return;
  }

  const { lat, lng } = req.body as { lat?: number; lng?: number };

  // Validation
  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: 'Latitude and longitude are required.' });
    return;
  }

  if (lat < -90 || lat > 90) {
    res.status(400).json({ error: 'Invalid latitude.' });
    return;
  }

  if (lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Invalid longitude.' });
    return;
  }

  // Update bike location
  const updatedBike: Bike = {
    ...appState.bikes[bikeIndex],
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    updatedAt: Date.now()
  };

  appState.bikes[bikeIndex] = updatedBike;
  saveState(appState);

  console.log(`[Bike Location] Updated bike ${updatedBike.label} to (${lat}, ${lng})`);
  res.json({ success: true, bike: updatedBike });
});

// ==================== ADMIN BIKE ROUTES ====================

app.get('/api/admin/bikes', verifyAdmin, (req: Request, res: Response): void => {
  res.json(appState.bikes || []);
});

app.get('/api/admin/bikes/:id', verifyAdmin, (req: Request, res: Response): void => {
  const bike = appState.bikes.find(b => b.id === req.params.id);
  if (!bike) {
    res.status(404).json({ error: 'Bicikl nije pronađen.' });
    return;
  }
  res.json(bike);
});

app.post('/api/admin/bikes', verifyAdmin, (req: Request, res: Response): void => {
  const { label, type, pricePerHour, lat, lng, status } = req.body as {
    label?: string;
    type?: BikeType;
    pricePerHour?: number;
    lat?: number;
    lng?: number;
    status?: BikeStatus;
  };

  // Validation
  if (!label || !type || pricePerHour === undefined || lat === undefined || lng === undefined) {
    res.status(400).json({ error: 'Sva obavezna polja moraju biti popunjena.' });
    return;
  }

  if (pricePerHour <= 0) {
    res.status(400).json({ error: 'Cena mora biti pozitivna vrednost.' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Nevalidne koordinate.' });
    return;
  }

  const validTypes: BikeType[] = ['CITY', 'E-BIKE', 'MTB'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'Nevalidan tip bicikla.' });
    return;
  }

  const validStatuses: BikeStatus[] = ['available', 'rented', 'maintenance', 'disabled'];
  const bikeStatus: BikeStatus = status || 'available';
  if (!validStatuses.includes(bikeStatus)) {
    res.status(400).json({ error: 'Nevalidan status bicikla.' });
    return;
  }

  // Check for duplicate label
  if (appState.bikes.some(b => b.label === label)) {
    res.status(400).json({ error: 'Bicikl sa ovom oznakom već postoji.' });
    return;
  }

  const newBike: Bike = {
    id: `bike_${uuidv4()}`,
    label,
    type,
    pricePerHour: parseFloat(String(pricePerHour)),
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    status: bikeStatus,
    updatedAt: Date.now()
  };

  appState.bikes.push(newBike);
  saveState(appState);

  res.status(201).json(newBike);
});

app.put('/api/admin/bikes/:id', verifyAdmin, (req: Request, res: Response): void => {
  const bikeIndex = appState.bikes.findIndex(b => b.id === req.params.id);
  if (bikeIndex === -1) {
    res.status(404).json({ error: 'Bicikl nije pronađen.' });
    return;
  }

  const bike = appState.bikes[bikeIndex];
  const { label, type, pricePerHour, lat, lng, status } = req.body as {
    label?: string;
    type?: BikeType;
    pricePerHour?: number;
    lat?: number;
    lng?: number;
    status?: BikeStatus;
  };

  // Check if bike is currently rented
  const isRented = appState.rentals.some(r => r.bikeId === bike.id && r.status === 'active');
  
  if (isRented && status && status !== 'rented') {
    res.status(400).json({ 
      error: 'Ne možete promeniti status bicikla koji je trenutno iznajmljen.' 
    });
    return;
  }

  // Validation
  if (pricePerHour !== undefined && pricePerHour <= 0) {
    res.status(400).json({ error: 'Cena mora biti pozitivna vrednost.' });
    return;
  }

  if (lat !== undefined && (lat < -90 || lat > 90)) {
    res.status(400).json({ error: 'Nevalidna geografska širina.' });
    return;
  }

  if (lng !== undefined && (lng < -180 || lng > 180)) {
    res.status(400).json({ error: 'Nevalidna geografska dužina.' });
    return;
  }

  if (type) {
    const validTypes: BikeType[] = ['CITY', 'E-BIKE', 'MTB'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: 'Nevalidan tip bicikla.' });
      return;
    }
  }

  if (status) {
    const validStatuses: BikeStatus[] = ['available', 'rented', 'maintenance', 'disabled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Nevalidan status bicikla.' });
      return;
    }
  }

  // Check for duplicate label
  if (label && label !== bike.label && appState.bikes.some(b => b.label === label)) {
    res.status(400).json({ error: 'Bicikl sa ovom oznakom već postoji.' });
    return;
  }

  // Update bike
  const updatedBike: Bike = {
    ...bike,
    ...(label && { label }),
    ...(type && { type }),
    ...(pricePerHour !== undefined && { pricePerHour: parseFloat(String(pricePerHour)) }),
    ...(lat !== undefined && { lat: parseFloat(String(lat)) }),
    ...(lng !== undefined && { lng: parseFloat(String(lng)) }),
    ...(status && { status }),
    updatedAt: Date.now()
  };

  appState.bikes[bikeIndex] = updatedBike;
  saveState(appState);

  res.json(updatedBike);
});

app.patch('/api/admin/bikes/:id/status', verifyAdmin, (req: Request, res: Response): void => {
  const bikeIndex = appState.bikes.findIndex(b => b.id === req.params.id);
  if (bikeIndex === -1) {
    res.status(404).json({ error: 'Bicikl nije pronađen.' });
    return;
  }

  const bike = appState.bikes[bikeIndex];
  const { status } = req.body as { status?: BikeStatus };

  const validStatuses: BikeStatus[] = ['available', 'rented', 'maintenance', 'disabled'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Nevalidan status bicikla.' });
    return;
  }

  // Check if bike is currently rented
  const isRented = appState.rentals.some(r => r.bikeId === bike.id && r.status === 'active');
  
  if (isRented && status !== 'rented') {
    res.status(400).json({ 
      error: 'Ne možete promeniti status bicikla koji je trenutno iznajmljen. Sačekajte da se iznajmljivanje završi.' 
    });
    return;
  }

  appState.bikes[bikeIndex] = {
    ...bike,
    status,
    updatedAt: Date.now()
  };
  saveState(appState);

  res.json(appState.bikes[bikeIndex]);
});

app.delete('/api/admin/bikes/:id', verifyAdmin, (req: Request, res: Response): void => {
  const bikeIndex = appState.bikes.findIndex(b => b.id === req.params.id);
  if (bikeIndex === -1) {
    res.status(404).json({ error: 'Bicikl nije pronađen.' });
    return;
  }

  // Check if bike has active rental
  const hasActiveRental = appState.rentals.some(r => r.bikeId === req.params.id && r.status === 'active');
  if (hasActiveRental) {
    res.status(400).json({ 
      error: 'Ne možete obrisati bicikl koji je trenutno iznajmljen.' 
    });
    return;
  }

  appState.bikes.splice(bikeIndex, 1);
  saveState(appState);

  res.json({ success: true });
});

// ==================== ADMIN PARKING ZONE ROUTES ====================

app.get('/api/admin/parkingZones', verifyAdmin, (req: Request, res: Response): void => {
  res.json(appState.parkingZones);
});

app.get('/api/admin/parkingZones/:id', verifyAdmin, (req: Request, res: Response): void => {
  const zone = appState.parkingZones.find(z => z.id === req.params.id);
  if (!zone) {
    res.status(404).json({ error: 'Parking zona nije pronađena.' });
    return;
  }
  res.json(zone);
});

app.post('/api/admin/parkingZones', verifyAdmin, (req: Request, res: Response): void => {
  const { name, lat, lng, radiusMeters } = req.body as {
    name?: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
  };

  // Validation
  if (!name || lat === undefined || lng === undefined || radiusMeters === undefined) {
    res.status(400).json({ error: 'Sva obavezna polja moraju biti popunjena.' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Nevalidne koordinate.' });
    return;
  }

  if (radiusMeters <= 0 || radiusMeters > 1000) {
    res.status(400).json({ error: 'Radijus mora biti između 1 i 1000 metara.' });
    return;
  }

  // Check for duplicate name
  if (appState.parkingZones.some(z => z.name.toLowerCase() === name.toLowerCase())) {
    res.status(400).json({ error: 'Parking zona sa ovim imenom već postoji.' });
    return;
  }

  const newZone: ParkingZone = {
    id: `pz_${uuidv4()}`,
    name,
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    radiusMeters: parseInt(String(radiusMeters), 10)
  };

  appState.parkingZones.push(newZone);
  saveState(appState);

  res.status(201).json(newZone);
});

app.put('/api/admin/parkingZones/:id', verifyAdmin, (req: Request, res: Response): void => {
  const zoneIndex = appState.parkingZones.findIndex(z => z.id === req.params.id);
  if (zoneIndex === -1) {
    res.status(404).json({ error: 'Parking zona nije pronađena.' });
    return;
  }

  const zone = appState.parkingZones[zoneIndex];
  const { name, lat, lng, radiusMeters } = req.body as {
    name?: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
  };

  // Validation
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    res.status(400).json({ error: 'Nevalidna geografska širina.' });
    return;
  }

  if (lng !== undefined && (lng < -180 || lng > 180)) {
    res.status(400).json({ error: 'Nevalidna geografska dužina.' });
    return;
  }

  if (radiusMeters !== undefined && (radiusMeters <= 0 || radiusMeters > 1000)) {
    res.status(400).json({ error: 'Radijus mora biti između 1 i 1000 metara.' });
    return;
  }

  // Check for duplicate name
  if (name && name.toLowerCase() !== zone.name.toLowerCase() && 
      appState.parkingZones.some(z => z.name.toLowerCase() === name.toLowerCase())) {
    res.status(400).json({ error: 'Parking zona sa ovim imenom već postoji.' });
    return;
  }

  const updatedZone: ParkingZone = {
    ...zone,
    ...(name && { name }),
    ...(lat !== undefined && { lat: parseFloat(String(lat)) }),
    ...(lng !== undefined && { lng: parseFloat(String(lng)) }),
    ...(radiusMeters !== undefined && { radiusMeters: parseInt(String(radiusMeters), 10) })
  };

  appState.parkingZones[zoneIndex] = updatedZone;
  saveState(appState);

  res.json(updatedZone);
});

app.delete('/api/admin/parkingZones/:id', verifyAdmin, (req: Request, res: Response): void => {
  const zoneIndex = appState.parkingZones.findIndex(z => z.id === req.params.id);
  if (zoneIndex === -1) {
    res.status(404).json({ error: 'Parking zona nije pronađena.' });
    return;
  }

  appState.parkingZones.splice(zoneIndex, 1);
  saveState(appState);

  res.json({ success: true });
});

// ==================== ADMIN RENTAL ROUTES ====================

interface EnrichedRental extends Rental {
  user: Partial<User> | null;
  bike: Bike | null;
}

app.get('/api/admin/rentals', verifyAdmin, (req: Request, res: Response): void => {
  const enrichedRentals: EnrichedRental[] = appState.rentals.map(rental => {
    const user = appState.users.find(u => u.id === rental.userId);
    const bike = appState.bikes.find(b => b.id === rental.bikeId);
    return {
      ...rental,
      user: user ? { 
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      } : null,
      bike: bike || null
    };
  }).sort((a, b) => b.startAt - a.startAt);

  res.json(enrichedRentals);
});

app.get('/api/admin/rentals/:id', verifyAdmin, (req: Request, res: Response): void => {
  const rental = appState.rentals.find(r => r.id === req.params.id);
  if (!rental) {
    res.status(404).json({ error: 'Iznajmljivanje nije pronađeno.' });
    return;
  }

  const user = appState.users.find(u => u.id === rental.userId);
  const bike = appState.bikes.find(b => b.id === rental.bikeId);

  res.json({
    ...rental,
    user: user ? { 
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    } : null,
    bike: bike || null
  });
});

// ==================== ADMIN ISSUE ROUTES ====================

interface EnrichedIssue extends Issue {
  user: Partial<User> | null;
  bike: Bike | null;
  rental: Rental | null;
}

app.get('/api/admin/issues', verifyAdmin, (req: Request, res: Response): void => {
  const enrichedIssues: EnrichedIssue[] = (appState.issues || []).map(issue => {
    const user = appState.users.find(u => u.id === issue.userId);
    const bike = issue.bikeId ? appState.bikes.find(b => b.id === issue.bikeId) : null;
    const rental = issue.rentalId ? appState.rentals.find(r => r.id === issue.rentalId) : null;
    return {
      ...issue,
      status: issue.status || 'open',
      adminNote: issue.adminNote || undefined,
      user: user ? { 
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      } : null,
      bike: bike || null,
      rental: rental || null
    };
  }).sort((a, b) => b.createdAt - a.createdAt);

  res.json(enrichedIssues);
});

app.get('/api/admin/issues/:id', verifyAdmin, (req: Request, res: Response): void => {
  const issue = appState.issues.find(i => i.id === req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Prijava problema nije pronađena.' });
    return;
  }

  const user = appState.users.find(u => u.id === issue.userId);
  const bike = issue.bikeId ? appState.bikes.find(b => b.id === issue.bikeId) : null;
  const rental = issue.rentalId ? appState.rentals.find(r => r.id === issue.rentalId) : null;

  res.json({
    ...issue,
    status: issue.status || 'open',
    adminNote: issue.adminNote || null,
    user: user ? { 
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    } : null,
    bike: bike || null,
    rental: rental || null
  });
});

app.put('/api/admin/issues/:id', verifyAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const issueIndex = appState.issues.findIndex(i => i.id === req.params.id);
  if (issueIndex === -1) {
    res.status(404).json({ error: 'Prijava problema nije pronađena.' });
    return;
  }

  const issue = appState.issues[issueIndex];
  const { status, adminNote, bikeAction } = req.body as {
    status?: IssueStatus;
    adminNote?: string;
    bikeAction?: 'maintenance' | 'disable' | 'available';
  };

  const validStatuses: IssueStatus[] = ['open', 'in-progress', 'resolved', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Nevalidan status prijave.' });
    return;
  }

  // Update issue
  appState.issues[issueIndex] = {
    ...issue,
    status: status || issue.status || 'open',
    adminNote: adminNote !== undefined ? adminNote : issue.adminNote,
    resolvedAt: status === 'resolved' || status === 'rejected' ? Date.now() : issue.resolvedAt,
    resolvedBy: status === 'resolved' || status === 'rejected' ? req.admin?.id : issue.resolvedBy
  };

  // Apply bike action if specified
  if (bikeAction && issue.bikeId) {
    const bikeIndex = appState.bikes.findIndex(b => b.id === issue.bikeId);
    if (bikeIndex !== -1) {
      const bike = appState.bikes[bikeIndex];
      const isRented = appState.rentals.some(r => r.bikeId === bike.id && r.status === 'active');
      
      if (!isRented) {
        if (bikeAction === 'maintenance') {
          appState.bikes[bikeIndex] = { ...bike, status: 'maintenance', updatedAt: Date.now() };
        } else if (bikeAction === 'disable') {
          appState.bikes[bikeIndex] = { ...bike, status: 'disabled', updatedAt: Date.now() };
        } else if (bikeAction === 'available') {
          appState.bikes[bikeIndex] = { ...bike, status: 'available', updatedAt: Date.now() };
        }
      }
    }
  }

  saveState(appState);

  // Return enriched issue
  const user = appState.users.find(u => u.id === issue.userId);
  const bike = issue.bikeId ? appState.bikes.find(b => b.id === issue.bikeId) : null;

  res.json({
    ...appState.issues[issueIndex],
    user: user ? { 
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    } : null,
    bike: bike || null
  });
});

// ==================== ADMIN USERS ROUTES ====================

app.get('/api/admin/users', verifyAdmin, (req: Request, res: Response): void => {
  const users = appState.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    createdAt: u.createdAt
  }));
  res.json(users);
});

// ==================== ADMIN STATS ROUTES ====================

interface DashboardStats {
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

app.get('/api/admin/stats', verifyAdmin, (req: Request, res: Response): void => {
  const totalBikes = appState.bikes.length;
  const availableBikes = appState.bikes.filter(b => b.status === 'available').length;
  const rentedBikes = appState.bikes.filter(b => b.status === 'rented').length;
  const maintenanceBikes = appState.bikes.filter(b => b.status === 'maintenance').length;
  const disabledBikes = appState.bikes.filter(b => b.status === 'disabled').length;

  const totalRentals = appState.rentals.length;
  const activeRentals = appState.rentals.filter(r => r.status === 'active').length;
  const finishedRentals = appState.rentals.filter(r => r.status === 'finished').length;

  const totalRevenue = appState.rentals
    .filter(r => r.status === 'finished' && r.totalPrice)
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  const totalUsers = appState.users.length;

  const openIssues = (appState.issues || []).filter(i => !i.status || i.status === 'open').length;
  const totalIssues = (appState.issues || []).length;

  const stats: DashboardStats = {
    bikes: {
      total: totalBikes,
      available: availableBikes,
      rented: rentedBikes,
      maintenance: maintenanceBikes,
      disabled: disabledBikes
    },
    rentals: {
      total: totalRentals,
      active: activeRentals,
      finished: finishedRentals,
      revenue: totalRevenue
    },
    users: {
      total: totalUsers
    },
    issues: {
      total: totalIssues,
      open: openIssues
    }
  };

  res.json(stats);
});

// ==================== PRODUCTION STATIC FILES ====================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req: Request, res: Response): void => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Admin server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile app can sync with: http://<your-ip>:${PORT}`);
  console.log(`\n🔐 Default admin login:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
});
