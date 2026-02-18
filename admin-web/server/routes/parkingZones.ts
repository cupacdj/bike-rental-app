import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ParkingZone } from '../types';
import { getAppState, saveState } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

router.get('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  res.json(appState.parkingZones);
});

router.get('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const zone = appState.parkingZones.find(z => z.id === req.params.id);
  if (!zone) {
    res.status(404).json({ error: 'Parking zona nije pronađena.' });
    return;
  }
  res.json(zone);
});

router.post('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const { name, lat, lng, radiusMeters, capacity } = req.body as {
    name?: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
    capacity?: number;
  };

  if (!name || lat === undefined || lng === undefined || radiusMeters === undefined || capacity === undefined) {
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

  if (capacity < 1 || capacity > 200) {
    res.status(400).json({ error: 'Kapacitet mora biti između 1 i 200.' });
    return;
  }

  if (appState.parkingZones.some(z => z.name.toLowerCase() === name.toLowerCase())) {
    res.status(400).json({ error: 'Parking zona sa ovim imenom već postoji.' });
    return;
  }

  const newZone: ParkingZone = {
    id: `pz_${uuidv4()}`,
    name,
    lat: parseFloat(String(lat)),
    lng: parseFloat(String(lng)),
    radiusMeters: parseInt(String(radiusMeters), 10),
    capacity: parseInt(String(capacity), 10),
  };

  appState.parkingZones.push(newZone);
  saveState(appState);

  res.status(201).json(newZone);
});

router.put('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const zoneIndex = appState.parkingZones.findIndex(z => z.id === req.params.id);
  if (zoneIndex === -1) {
    res.status(404).json({ error: 'Parking zona nije pronađena.' });
    return;
  }

  const zone = appState.parkingZones[zoneIndex];
  const { name, lat, lng, radiusMeters, capacity } = req.body as {
    name?: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
    capacity?: number;
  };

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

  if (capacity !== undefined && (capacity < 1 || capacity > 200)) {
    res.status(400).json({ error: 'Kapacitet mora biti između 1 i 200.' });
    return;
  }

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
    ...(radiusMeters !== undefined && { radiusMeters: parseInt(String(radiusMeters), 10) }),
    ...(capacity !== undefined && { capacity: parseInt(String(capacity), 10) }),
  };

  appState.parkingZones[zoneIndex] = updatedZone;
  saveState(appState);

  res.json(updatedZone);
});

router.delete('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const zoneIndex = appState.parkingZones.findIndex(z => z.id === req.params.id);
  if (zoneIndex === -1) {
    res.status(404).json({ error: 'Parking zona nije pronađena.' });
    return;
  }

  appState.parkingZones.splice(zoneIndex, 1);
  saveState(appState);

  res.json({ success: true });
});

export default router;
