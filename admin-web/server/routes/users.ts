import { Router, Request, Response } from 'express';
import { getAppState } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

router.get('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const users = appState.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

export default router;
