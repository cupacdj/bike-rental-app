import { Router, Request, Response } from 'express';
import { DashboardStats } from '../types';
import { getAppState } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

router.get('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();

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
      disabled: disabledBikes,
    },
    rentals: {
      total: totalRentals,
      active: activeRentals,
      finished: finishedRentals,
      revenue: totalRevenue,
    },
    users: {
      total: totalUsers,
    },
    issues: {
      total: totalIssues,
      open: openIssues,
    },
  };

  res.json(stats);
});

export default router;
