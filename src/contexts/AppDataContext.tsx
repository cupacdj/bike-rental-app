import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { buildInitialState } from '../data/seed';
import { AppNotification, AppState, Bike, BikeStatus, IssueReport, ParkingZone, Rental, User } from '../types';
import { loadState, saveState, clearState } from '../services/storage';
import { hashPassword, randomSalt } from '../services/crypto';
import { persistPhoto } from '../services/media';
import { haversineMeters, money2 } from '../utils/geo';
import { isEmail, isPhone, isStrongPassword } from '../utils/validators';
import { getServerUrl } from "../services/syncConfig";
import { getRemoteState, putRemoteState, uploadImageAsync, updateBikeLocation } from "../services/syncApi";

type RegisterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type StartRentalInput = {
  bikeId: string;
  startLat?: number;
  startLng?: number;
};

type EndRentalInput = {
  rentalId: string;
  endLat?: number;
  endLng?: number;
  returnPhotoUri: string; // temp uri from camera/picker
};

type ReportIssueInput = {
  description: string;
  photoUri: string;
  bikeId?: string;
  rentalId?: string;
};

type AppData = {
  ready: boolean;
  state: AppState;
  currentUser?: User;
  isOnline: boolean;

  // Auth
  register: (input: RegisterInput) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Profile
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  changePassword: (input: ChangePasswordInput) => Promise<boolean>;

  // Rentals
  startRental: (input: StartRentalInput) => Promise<{ ok: boolean; error?: string; rental?: Rental }>;
  endRental: (input: EndRentalInput) => Promise<{ ok: boolean; error?: string; rental?: Rental }>;
  getActiveRental: () => Rental | undefined;

  // Bikes / Parking
  getBikeById: (bikeId: string) => Bike | undefined;
  nearestParkingFor: (lat: number, lng: number) => { zone: ParkingZone; distanceM: number } | undefined;
  isInsideAnyParking: (lat: number, lng: number) => { zone: ParkingZone; distanceM: number } | undefined;

  // Notifications
  notificationsForUser: () => AppNotification[];

  // Issues
  reportIssue: (input: ReportIssueInput) => Promise<{ ok: boolean; error?: string; issue?: IssueReport }>;

  // Sync
  refreshFromServer: () => Promise<void>;

  // Debug
  resetAllLocalData: () => Promise<void>;
};

const Ctx = createContext<AppData | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => buildInitialState());
  const [isOnline, setIsOnline] = useState(false);

  // Helper function to merge arrays by id
  function mergeArraysById<T extends { id: string }>(local: T[], remote: T[]): T[] {
    const map = new Map<string, T>();
    // Add local items first
    local.forEach(item => map.set(item.id, item));
    // Override/add remote items (server is source of truth for existing items)
    remote.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  }

  // Function to fetch fresh data from server
  const refreshFromServer = useCallback(async () => {
    try {
      // Always re-read the server URL (it might have just been saved)
      const serverUrl = await getServerUrl();
      console.log('[AppData] Server URL:', serverUrl);
      
      if (!serverUrl) {
        console.log('[AppData] No server URL configured');
        setIsOnline(false);
        return;
      }

      console.log('[AppData] Fetching data from server...');
      const remoteState = await getRemoteState();
      console.log('[AppData] Got remote state:', remoteState ? 'success' : 'empty');
      setIsOnline(true);

      // Merge server data with local user session
      // Server has: bikes, parkingZones, rentals, issues, notifications
      // Local keeps: users, currentUserId (user session)
      setState(prev => {
        const merged: AppState = {
          ...prev,
          // From server (admin manages these)
          bikes: remoteState.bikes || prev.bikes,
          parkingZones: remoteState.parkingZones || prev.parkingZones,
          // Merge rentals - keep local rentals and add server ones
          rentals: mergeArraysById(prev.rentals, remoteState.rentals || []),
          // Merge issues
          issues: mergeArraysById(prev.issues, remoteState.issues || []),
          // Merge notifications
          notifications: mergeArraysById(prev.notifications, remoteState.notifications || []),
          // Keep local users and merge with server users
          users: mergeArraysById(prev.users, remoteState.users || []),
          // Keep current user session
          currentUserId: prev.currentUserId,
        };
        return merged;
      });

      console.log('[AppData] Server data synced successfully');
    } catch (error) {
      console.warn('[AppData] Failed to fetch from server:', error);
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      // Load local state first
      const loaded = await loadState();
      if (loaded) {
        setState(loaded);
      } else {
        const initial = buildInitialState();
        setState(initial);
        await saveState(initial);
      }
      
      // Then try to sync with server
      try {
        const serverUrl = await getServerUrl();
        if (serverUrl) {
          console.log('[AppData] Server URL configured, fetching remote data...');
          const remoteState = await getRemoteState();
          setIsOnline(true);
          
          setState(prev => ({
            ...prev,
            bikes: remoteState.bikes || prev.bikes,
            parkingZones: remoteState.parkingZones || prev.parkingZones,
            rentals: mergeArraysById(prev.rentals, remoteState.rentals || []),
            issues: mergeArraysById(prev.issues, remoteState.issues || []),
            notifications: mergeArraysById(prev.notifications, remoteState.notifications || []),
            users: mergeArraysById(prev.users, remoteState.users || []),
          }));
        }
      } catch (error) {
        console.warn('[AppData] Could not connect to server:', error);
        setIsOnline(false);
      }
      
      setReady(true);
    })();
  }, []);

  const currentUser = useMemo(() => {
    if (!state.currentUserId) return undefined;
    return state.users.find((u) => u.id === state.currentUserId);
  }, [state.currentUserId, state.users]);

  async function commit(next: AppState) {
    setState(next);
    // Always save locally first
    await saveState(next);
    // Then try to sync to server
    await syncToServer(next);
  }

  async function syncToServer(stateToSync: AppState) {
    try {
      const serverUrl = await getServerUrl();
      if (serverUrl) {
        await putRemoteState(stateToSync);
        setIsOnline(true);
      }
    } catch (error) {
      console.warn('[AppData] Failed to sync to server:', error);
      setIsOnline(false);
    }
  }


  async function register(input: RegisterInput): Promise<boolean> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phone = input.phone.trim();
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const password = input.password;
    const confirmPassword = input.confirmPassword;

    if (!firstName || !lastName || !phone || !email || !username || !password || !confirmPassword) {
      Alert.alert('Greška', 'Sva polja su obavezna.');
      return false;
    }
    if (!isEmail(email)) {
      Alert.alert('Greška', 'Email adresa nije u ispravnom formatu.');
      return false;
    }
    if (!isPhone(phone)) {
      Alert.alert('Greška', 'Kontakt telefon nije u ispravnom formatu.');
      return false;
    }
    if (!isStrongPassword(password)) {
      Alert.alert('Greška', 'Lozinka mora imati najmanje 6 karaktera.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Greška', 'Lozinka i potvrda lozinke se ne poklapaju.');
      return false;
    }

    const usernameTaken = state.users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    const emailTaken = state.users.some((u) => u.email.toLowerCase() === email);
    if (usernameTaken) {
      Alert.alert('Greška', 'Korisničko ime je već u upotrebi.');
      return false;
    }
    if (emailTaken) {
      Alert.alert('Greška', 'Email adresa je već u upotrebi.');
      return false;
    }

    const salt = randomSalt();
    const hash = await hashPassword(password, salt);
    const user: User = {
      id: uid('usr'),
      username,
      email,
      phone,
      firstName,
      lastName,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: Date.now(),
    };

    const next: AppState = {
      ...state,
      users: [...state.users, user],
    };

    await commit(next);
    Alert.alert('Uspeh', 'Nalog je uspešno kreiran.');
    return true;
  }

  async function login(username: string, password: string): Promise<boolean> {
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      Alert.alert('Greška', 'Unesite korisničko ime i lozinku.');
      return false;
    }
    const user = state.users.find((x) => x.username.toLowerCase() === u.toLowerCase());
    if (!user) {
      Alert.alert('Greška', 'Pogrešno korisničko ime ili lozinka.');
      return false;
    }
    const hash = await hashPassword(p, user.passwordSalt);
    if (hash !== user.passwordHash) {
      Alert.alert('Greška', 'Pogrešno korisničko ime ili lozinka.');
      return false;
    }

    const next: AppState = { ...state, currentUserId: user.id };
    await commit(next);
    return true;
  }

  async function logout(): Promise<void> {
    const next: AppState = { ...state, currentUserId: undefined };
    await commit(next);
  }

  async function updateProfile(input: UpdateProfileInput): Promise<boolean> {
    if (!currentUser) {
      Alert.alert('Greška', 'Niste prijavljeni.');
      return false;
    }
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phone = input.phone.trim();
    const email = input.email.trim().toLowerCase();

    if (!firstName || !lastName || !phone || !email) {
      Alert.alert('Greška', 'Sva polja su obavezna.');
      return false;
    }
    if (!isEmail(email)) {
      Alert.alert('Greška', 'Email adresa nije u ispravnom formatu.');
      return false;
    }
    if (!isPhone(phone)) {
      Alert.alert('Greška', 'Kontakt telefon nije u ispravnom formatu.');
      return false;
    }

    const emailTaken = state.users.some((u) => u.id !== currentUser.id && u.email.toLowerCase() === email);
    if (emailTaken) {
      Alert.alert('Greška', 'Email adresa je već u upotrebi.');
      return false;
    }

    const users = state.users.map((u) =>
      u.id === currentUser.id ? { ...u, firstName, lastName, phone, email } : u
    );
    await commit({ ...state, users });
    Alert.alert('Uspeh', 'Podaci su uspešno sačuvani.');
    return true;
  }

  async function changePassword(input: ChangePasswordInput): Promise<boolean> {
    if (!currentUser) {
      Alert.alert('Greška', 'Niste prijavljeni.');
      return false;
    }

    const { currentPassword, newPassword, confirmNewPassword } = input;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Greška', 'Sva polja su obavezna.');
      return false;
    }
    const currentHash = await hashPassword(currentPassword, currentUser.passwordSalt);
    if (currentHash !== currentUser.passwordHash) {
      Alert.alert('Greška', 'Trenutna lozinka nije tačna.');
      return false;
    }
    if (!isStrongPassword(newPassword)) {
      Alert.alert('Greška', 'Nova lozinka mora imati najmanje 6 karaktera.');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Greška', 'Nova lozinka i potvrda se ne poklapaju.');
      return false;
    }

    const salt = randomSalt();
    const hash = await hashPassword(newPassword, salt);
    const users = state.users.map((u) =>
      u.id === currentUser.id ? { ...u, passwordSalt: salt, passwordHash: hash } : u
    );
    await commit({ ...state, users });
    Alert.alert('Uspeh', 'Lozinka je promenjena.');
    return true;
  }

  function getActiveRental(): Rental | undefined {
    if (!currentUser) return undefined;
    return state.rentals.find((r) => r.userId === currentUser.id && r.status === 'active');
  }

  function getBikeById(bikeId: string): Bike | undefined {
    // Search by ID first, then by label (case-insensitive)
    const searchTerm = bikeId.trim();
    return state.bikes.find((b) => 
      b.id === searchTerm || 
      b.id.toLowerCase() === searchTerm.toLowerCase() ||
      b.label.toLowerCase() === searchTerm.toLowerCase()
    );
  }

  function nearestParkingFor(lat: number, lng: number) {
    if (!state.parkingZones.length) return undefined;
    let best: { zone: ParkingZone; distanceM: number } | undefined;
    for (const z of state.parkingZones) {
      const d = haversineMeters(lat, lng, z.lat, z.lng);
      if (!best || d < best.distanceM) best = { zone: z, distanceM: d };
    }
    return best;
  }

  function isInsideAnyParking(lat: number, lng: number) {
    for (const z of state.parkingZones) {
      const d = haversineMeters(lat, lng, z.lat, z.lng);
      if (d <= z.radiusMeters) {
        return { zone: z, distanceM: d };
      }
    }
    return undefined;
  }

  function addNotification(userId: string, title: string, message: string, relatedRentalId?: string) {
    const n: AppNotification = {
      id: uid('not'),
      userId,
      createdAt: Date.now(),
      title,
      message,
      relatedRentalId,
    };
    return n;
  }

  async function startRental(input: StartRentalInput) {
    if (!currentUser) {
      return { ok: false, error: 'Niste prijavljeni.' };
    }
    const active = getActiveRental();
    if (active) {
      return { ok: false, error: 'Već imate aktivno iznajmljivanje.' };
    }

    // Debug: log available bikes
    console.log('[startRental] Looking for bike:', input.bikeId);
    console.log('[startRental] Available bikes:', state.bikes.map(b => ({ id: b.id, label: b.label, status: b.status })));

    const bike = getBikeById(input.bikeId);
    if (!bike) {
      const availableBikes = state.bikes.map(b => b.label || b.id).join(', ');
      return { ok: false, error: `Bicikl "${input.bikeId}" ne postoji. Dostupni: ${availableBikes || 'nema'}` };
    }
    if (bike.status !== 'available') {
      return { ok: false, error: `Bicikl ${bike.label} nije dostupan (status: ${bike.status}).` };
    }

    const rental: Rental = {
      id: uid('ren'),
      userId: currentUser.id,
      bikeId: bike.id,
      startAt: Date.now(),
      startLat: input.startLat,
      startLng: input.startLng,
      status: 'active',
    };

    const bikes = state.bikes.map((b) => (b.id === bike.id ? { ...b, status: 'rented' as BikeStatus, updatedAt: Date.now() } : b));
    const notif = addNotification(
      currentUser.id,
      'Iznajmljivanje započeto',
      `Uspešno ste započeli iznajmljivanje bicikla ${bike.label}.`,
      rental.id
    );

    const next: AppState = {
      ...state,
      bikes,
      rentals: [...state.rentals, rental],
      notifications: [notif, ...state.notifications],
    };

    await commit(next);
    Alert.alert('Uspeh', 'Iznajmljivanje uspešno započeto.');
    return { ok: true, rental };
  }

  async function endRental(input: EndRentalInput) {
    if (!currentUser) {
      return { ok: false, error: 'Niste prijavljeni.' };
    }
    const rental = state.rentals.find((r) => r.id === input.rentalId);
    if (!rental || rental.userId !== currentUser.id) {
      return { ok: false, error: 'Iznajmljivanje nije pronađeno.' };
    }
    if (rental.status !== 'active') {
      return { ok: false, error: 'Iznajmljivanje je već završeno.' };
    }

    const bike = getBikeById(rental.bikeId);
    if (!bike) {
      return { ok: false, error: 'Bicikl nije pronađen.' };
    }

    if (!input.returnPhotoUri) {
      return { ok: false, error: 'Fotografija je obavezna.' };
    }

    // Try to save photo locally first
    let savedPhoto: string = input.returnPhotoUri;
    try {
      savedPhoto = await persistPhoto(input.returnPhotoUri, `return_${rental.id}`);
    } catch (e) {
      console.warn('[endRental] Local photo save failed:', e);
      // Continue with original URI - we'll try to upload to server
    }

    // Try to upload photo to server
    let serverPhotoUrl: string | undefined;
    try {
      const serverUrl = await getServerUrl();
      if (serverUrl) {
        console.log('[endRental] Uploading photo to server...');
        serverPhotoUrl = await uploadImageAsync(input.returnPhotoUri, 'rental');
        console.log('[endRental] Photo uploaded:', serverPhotoUrl);
        // Use server URL as the photo reference
        savedPhoto = serverPhotoUrl;
      }
    } catch (e) {
      console.warn('[endRental] Server photo upload failed:', e);
      // Continue with local photo - will be synced later
    }

    const endAt = Date.now();
    const elapsedHours = Math.max(0, endAt - rental.startAt) / 3600000;
    const totalPrice = money2(elapsedHours * bike.pricePerHour);

    const finished: Rental = {
      ...rental,
      endAt,
      endLat: input.endLat,
      endLng: input.endLng,
      totalPrice,
      returnPhotoUri: savedPhoto,
      status: 'finished',
    };

    const rentals = state.rentals.map((r) => (r.id === rental.id ? finished : r));
    
    // Update bike location to return location and update status
    const updatedBike: Bike = {
      ...bike,
      status: 'available' as BikeStatus,
      updatedAt: Date.now(),
      // Update bike coordinates to return location
      ...(input.endLat !== undefined && input.endLng !== undefined && {
        lat: input.endLat,
        lng: input.endLng,
      }),
    };
    
    const bikes = state.bikes.map((b) => (b.id === bike.id ? updatedBike : b));

    // Try to update bike location on server
    if (input.endLat !== undefined && input.endLng !== undefined) {
      try {
        const serverUrl = await getServerUrl();
        if (serverUrl) {
          console.log('[endRental] Updating bike location on server...');
          await updateBikeLocation(bike.id, input.endLat, input.endLng);
          console.log('[endRental] Bike location updated on server');
        }
      } catch (e) {
        console.warn('[endRental] Failed to update bike location on server:', e);
        // Continue - bike location is stored locally
      }
    }

    const notif = addNotification(
      currentUser.id,
      'Iznajmljivanje završeno',
      `Iznajmljivanje bicikla ${bike.label} je završeno. Ukupan iznos: ${totalPrice} RSD.`,
      rental.id
    );

    const next: AppState = {
      ...state,
      bikes,
      rentals,
      notifications: [notif, ...state.notifications],
    };

    await commit(next);
    Alert.alert('Uspeh', 'Iznajmljivanje uspešno završeno.');
    return { ok: true, rental: finished };
  }

  function notificationsForUser(): AppNotification[] {
    if (!currentUser) return [];
    return state.notifications
      .filter((n) => n.userId === currentUser.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async function reportIssue(input: ReportIssueInput) {
    if (!currentUser) {
      return { ok: false, error: 'Niste prijavljeni.' };
    }
    const description = input.description.trim();
    if (!description) {
      return { ok: false, error: 'Opis je obavezan.' };
    }
    if (!input.photoUri) {
      return { ok: false, error: 'Fotografija je obavezna.' };
    }

    let savedPhoto: string;
    try {
      savedPhoto = await persistPhoto(input.photoUri, `issue_${Date.now()}`);
    } catch (e) {
      console.warn(e);
      return { ok: false, error: 'Neuspešno čuvanje fotografije.' };
    }

    const issue: IssueReport = {
      id: uid('iss'),
      userId: currentUser.id,
      bikeId: input.bikeId,
      rentalId: input.rentalId,
      createdAt: Date.now(),
      description,
      photoUri: savedPhoto,
    };

    const notif = addNotification(
      currentUser.id,
      'Prijava problema poslata',
      'Vaša prijava problema je uspešno poslata administratoru.'
    );

    const next: AppState = {
      ...state,
      issues: [issue, ...state.issues],
      notifications: [notif, ...state.notifications],
    };

    await commit(next);
    Alert.alert('Uspeh', 'Problem je uspešno prijavljen.');
    return { ok: true, issue };
  }

  async function resetAllLocalData(): Promise<void> {
    await clearState();
    const initial = buildInitialState();
    setState(initial);
    // Try to sync fresh from server after reset
    await refreshFromServer();
    Alert.alert('Reset', 'Lokalni podaci su obrisani.');
  }

  const value: AppData = {
    ready,
    state,
    currentUser,
    isOnline,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    startRental,
    endRental,
    getActiveRental,
    getBikeById,
    nearestParkingFor,
    isInsideAnyParking,
    notificationsForUser,
    reportIssue,
    refreshFromServer,
    resetAllLocalData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppDataContext missing');
  return v;
}

