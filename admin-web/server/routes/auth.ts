import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../types';
import { getAdmins, updateAdmin } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Korisničko ime i lozinka su obavezni.' });
    return;
  }

  const admins = getAdmins();
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

  const { passwordHash, ...adminInfo } = admin;
  res.json({
    success: true,
    admin: adminInfo,
    token: Buffer.from(`${admin.id}:${Date.now()}`).toString('base64'),
  });
});

// Change password
router.post('/change-password', verifyAdmin, (req: AuthenticatedRequest, res: Response): void => {
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

  const isValid = bcrypt.compareSync(currentPassword, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Trenutna lozinka nije ispravna.' });
    return;
  }

  const updated = updateAdmin(admin.id, { passwordHash: bcrypt.hashSync(newPassword, 10) });
  if (!updated) {
    res.status(404).json({ error: 'Administrator nije pronađen.' });
    return;
  }

  res.json({ success: true });
});

// Change username
router.post('/change-username', verifyAdmin, (req: AuthenticatedRequest, res: Response): void => {
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

  const isValid = bcrypt.compareSync(password, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Lozinka nije ispravna.' });
    return;
  }

  const admins = getAdmins();
  const existingAdmin = admins.find(
    a => a.username.toLowerCase() === newUsername.toLowerCase() && a.id !== admin.id,
  );
  if (existingAdmin) {
    res.status(400).json({ error: 'Korisničko ime je već zauzeto.' });
    return;
  }

  const updated = updateAdmin(admin.id, { username: newUsername });
  if (!updated) {
    res.status(404).json({ error: 'Administrator nije pronađen.' });
    return;
  }

  const { passwordHash, ...adminInfo } = updated;
  res.json({ success: true, admin: adminInfo });
});

export default router;
