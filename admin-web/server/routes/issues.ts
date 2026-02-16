import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, IssueStatus, EnrichedIssue } from '../types';
import { getAppState, saveState } from '../state';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

router.get('/', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();

  const enrichedIssues: EnrichedIssue[] = (appState.issues || []).map(issue => {
    const user = appState.users.find(u => u.id === issue.userId);
    const bike = issue.bikeId ? appState.bikes.find(b => b.id === issue.bikeId) : null;
    const rental = issue.rentalId ? appState.rentals.find(r => r.id === issue.rentalId) : null;
    return {
      ...issue,
      status: issue.status || 'open',
      adminNote: issue.adminNote || undefined,
      user: user ? {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      } : null,
      bike: bike || null,
      rental: rental || null,
    };
  }).sort((a, b) => b.createdAt - a.createdAt);

  res.json(enrichedIssues);
});

router.get('/:id', verifyAdmin, (req: Request, res: Response): void => {
  const appState = getAppState();
  const issue = appState.issues.find(i => i.id === req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Prijava problema nije pronađena.' });
    return;
  }

  const user = appState.users.find(u => u.id === issue.userId);
  const bike = issue.bikeId ? appState.bikes.find(b => b.id === issue.bikeId) : null;
  const rental = issue.rentalId ? appState.rentals.find(r => r.id === issue.rentalId) : null;

  res.json({
    ...issue,
    status: issue.status || 'open',
    adminNote: issue.adminNote || null,
    user: user ? {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    } : null,
    bike: bike || null,
    rental: rental || null,
  });
});

router.put('/:id', verifyAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const appState = getAppState();
  const issueIndex = appState.issues.findIndex(i => i.id === req.params.id);
  if (issueIndex === -1) {
    res.status(404).json({ error: 'Prijava problema nije pronađena.' });
    return;
  }

  const issue = appState.issues[issueIndex];
  const { status, adminNote, bikeAction } = req.body as {
    status?: IssueStatus;
    adminNote?: string;
    bikeAction?: 'maintenance' | 'disable' | 'available';
  };

  const validStatuses: IssueStatus[] = ['open', 'in-progress', 'resolved', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Nevalidan status prijave.' });
    return;
  }

  appState.issues[issueIndex] = {
    ...issue,
    status: status || issue.status || 'open',
    adminNote: adminNote !== undefined ? adminNote : issue.adminNote,
    resolvedAt: status === 'resolved' || status === 'rejected' ? Date.now() : issue.resolvedAt,
    resolvedBy: status === 'resolved' || status === 'rejected' ? req.admin?.id : issue.resolvedBy,
  };

  // Apply bike action if specified
  if (bikeAction && issue.bikeId) {
    const bikeIndex = appState.bikes.findIndex(b => b.id === issue.bikeId);
    if (bikeIndex !== -1) {
      const bike = appState.bikes[bikeIndex];
      const isRented = appState.rentals.some(r => r.bikeId === bike.id && r.status === 'active');

      if (!isRented) {
        if (bikeAction === 'maintenance') {
          appState.bikes[bikeIndex] = { ...bike, status: 'maintenance', updatedAt: Date.now() };
        } else if (bikeAction === 'disable') {
          appState.bikes[bikeIndex] = { ...bike, status: 'disabled', updatedAt: Date.now() };
        } else if (bikeAction === 'available') {
          appState.bikes[bikeIndex] = { ...bike, status: 'available', updatedAt: Date.now() };
        }
      }
    }
  }

  saveState(appState);

  // Return enriched issue
  const user = appState.users.find(u => u.id === issue.userId);
  const bike = issue.bikeId ? appState.bikes.find(b => b.id === issue.bikeId) : null;

  res.json({
    ...appState.issues[issueIndex],
    user: user ? {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    } : null,
    bike: bike || null,
  });
});

export default router;
