import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { getAdmins } from '../state';

export function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Neautorizovan pristup.' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [adminId] = decoded.split(':');
    const admins = getAdmins();
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
