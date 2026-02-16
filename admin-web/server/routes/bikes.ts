import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Bike, BikeType, BikeStatus } from '../types';
import { getAppState, saveState } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();


// Update bike location (called when bike is returned after rental)
router.patch('/:id/location', (req: Request, res: Response): void => {
  const appState = getAppState();
  const bikeIndex = appState.bikes.findIndex(b => b.id === req.params.id);
  if (bikeIndex === -1) {
    res.status(404).json({ error: 'Bike not found.' });
    return;
  }

  const { lat, lng } = req.body as { lat?: number; lng?: number };

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

  const updatedBike: Bike = {
    ...appState.bikes[bikeIndex],
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    updatedAt: Date.now(),
  };

  appState.bikes[bikeIndex] = updatedBike;
  saveState(appState);

  console.log(`[Bike Location] Updated bike ${updatedBike.label} to (${lat}, ${lng})`);
  res.json({ success: true, bike: updatedBike });
});


router.get('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  res.json(appState.bikes || []);
});

router.get('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const bike = appState.bikes.find(b => b.id === req.params.id);
  if (!bike) {
    res.status(404).json({ error: 'Bicikl nije pronađen.' });
    return;
  }
  res.json(bike);
});

router.post('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const { label, type, pricePerHour, lat, lng, status } = req.body as {
    label?: string;
    type?: BikeType;
    pricePerHour?: number;
    lat?: number;
    lng?: number;
    status?: BikeStatus;
  };

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
    updatedAt: Date.now(),
  };

  appState.bikes.push(newBike);
  saveState(appState);

  res.status(201).json(newBike);
});

router.put('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
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

  const isRented = appState.rentals.some(r => r.bikeId === bike.id && r.status === 'active');

  if (isRented && status && status !== 'rented') {
    res.status(400).json({
      error: 'Ne možete promeniti status bicikla koji je trenutno iznajmljen.',
    });
    return;
  }

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

  if (label && label !== bike.label && appState.bikes.some(b => b.label === label)) {
    res.status(400).json({ error: 'Bicikl sa ovom oznakom već postoji.' });
    return;
  }

  const updatedBike: Bike = {
    ...bike,
    ...(label && { label }),
    ...(type && { type }),
    ...(pricePerHour !== undefined && { pricePerHour: parseFloat(String(pricePerHour)) }),
    ...(lat !== undefined && { lat: parseFloat(String(lat)) }),
    ...(lng !== undefined && { lng: parseFloat(String(lng)) }),
    ...(status && { status }),
    updatedAt: Date.now(),
  };

  appState.bikes[bikeIndex] = updatedBike;
  saveState(appState);

  res.json(updatedBike);
});

router.patch('/:id/status', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
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

  const isRented = appState.rentals.some(r => r.bikeId === bike.id && r.status === 'active');

  if (isRented && status !== 'rented') {
    res.status(400).json({
      error: 'Ne možete promeniti status bicikla koji je trenutno iznajmljen. Sačekajte da se iznajmljivanje završi.',
    });
    return;
  }

  appState.bikes[bikeIndex] = {
    ...bike,
    status,
    updatedAt: Date.now(),
  };
  saveState(appState);

  res.json(appState.bikes[bikeIndex]);
});

router.delete('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const bikeIndex = appState.bikes.findIndex(b => b.id === req.params.id);
  if (bikeIndex === -1) {
    res.status(404).json({ error: 'Bicikl nije pronađen.' });
    return;
  }

  const hasActiveRental = appState.rentals.some(r => r.bikeId === req.params.id && r.status === 'active');
  if (hasActiveRental) {
    res.status(400).json({
      error: 'Ne možete obrisati bicikl koji je trenutno iznajmljen.',
    });
    return;
  }

  appState.bikes.splice(bikeIndex, 1);
  saveState(appState);

  res.json({ success: true });
});

export default router;
