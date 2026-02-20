import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import { uploadsPath } from './config/multer';

// Route imports
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import bikesRoutes from './routes/bikes';
import parkingZonesRoutes from './routes/parkingZones';
import rentalsRoutes from './routes/rentals';
import issuesRoutes from './routes/issues';
import usersRoutes from './routes/users';
import statsRoutes from './routes/stats';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(uploadsPath));

// Auth (login, change-password, change-username)
app.use('/api/admin', authRoutes);

// State sync & file upload (mobile app)
app.use('/api', syncRoutes);

// Bikes (public location update + admin CRUD)
app.use('/api/bikes', bikesRoutes);          // public: PATCH /:id/location
app.use('/api/admin/bikes', bikesRoutes);    // admin:  GET, POST, PUT, DELETE, PATCH status

// Parking zones
app.use('/api/admin/parkingZones', parkingZonesRoutes);

// Rentals
app.use('/api/admin/rentals', rentalsRoutes);

// Issues
app.use('/api/admin/issues', issuesRoutes);

// Users
app.use('/api/admin/users', usersRoutes);

// Stats / Dashboard
app.use('/api/admin/stats', statsRoutes);


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req: Request, res: Response): void => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Admin server running on http://localhost:${PORT}`);
  console.log(`Mobile app can sync with: http://<your-ip>:${PORT}`);
  console.log(`\nDefault admin login:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
});
