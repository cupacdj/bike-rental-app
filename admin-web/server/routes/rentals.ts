import { Router, Request, Response } from 'express';
import { EnrichedRental } from '../types';
import { getAppState } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

router.get('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();

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
        phone: user.phone,
      } : null,
      bike: bike || null,
    };
  }).sort((a, b) => b.startAt - a.startAt);

  res.json(enrichedRentals);
});

router.get('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
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
      phone: user.phone,
    } : null,
    bike: bike || null,
  });
});

export default router;
