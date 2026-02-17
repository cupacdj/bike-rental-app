import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AppState } from '../types';
import { getAppState, setAppState } from '../state';
import { upload, uploadsPath } from '../config/multer';

const router = Router();

const PORT = process.env.PORT || 5000;

// GET full state (for mobile app sync)
router.get('/state', (req: Request, res: Response): void => {
  res.json(getAppState());
});

// PUT full state (for mobile app sync)
router.put('/state', (req: Request, res: Response): void => {
  const newState = req.body as AppState;
  if (!newState) {
    res.status(400).json({ error: 'Invalid state' });
    return;
  }

  // Validate no duplicate usernames or emails
  if (newState.users && newState.users.length > 0) {
    const usernames = new Map<string, string>();
    const emails = new Map<string, string>();

    for (const user of newState.users) {
      const usernameLower = user.username.toLowerCase();
      const emailLower = user.email.toLowerCase();

      // Check for duplicate username
      if (usernames.has(usernameLower)) {
        res.status(400).json({ 
          error: `Duplikat korisničko ime: "${user.username}" (korisnici: ${usernames.get(usernameLower)}, ${user.id})` 
        });
        return;
      }
      usernames.set(usernameLower, user.id);

      // Check for duplicate email
      if (emails.has(emailLower)) {
        res.status(400).json({ 
          error: `Duplikat email adresa: "${user.email}" (korisnici: ${emails.get(emailLower)}, ${user.id})` 
        });
        return;
      }
      emails.set(emailLower, user.id);
    }
  }

  setAppState(newState);
  res.json({ success: true });
});

// Upload a file
router.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const kind = (req.body as { kind?: string }).kind || 'general';

  const kindDir = path.join(uploadsPath, kind);
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

  const host = req.headers.host || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const url = `${protocol}://${host}/uploads/${kind}/${req.file.filename}`;

  console.log('[Upload] File saved:', url);
  res.json({ url });
});

export default router;
