import { createContext, useContext } from 'react';
import { TabKey } from '../components/BottomTabs';

export type Route =
  | { name: 'Login' }
  | { name: 'Register' }
  | { name: 'Tabs'; tab: TabKey }
  | { name: 'BikeDetails'; bikeId: string }
  | { name: 'QRScanner' }
  | { name: 'CaptureReturnPhoto'; rentalId: string; endLat?: number; endLng?: number }
  | { name: 'RentalSummary'; rentalId: string }
  | { name: 'RentalDetails'; rentalId: string }
  | { name: 'EditProfile' }
  | { name: 'ChangePassword' }
  | { name: 'ReportIssue'; bikeId?: string; rentalId?: string };

export type Nav = {
  route: Route;
  push: (r: Route) => void;
  pop: () => void;
  resetToTabs: (tab?: TabKey) => void;
  setTab: (tab: TabKey) => void;
};

export const NavCtx = createContext<Nav | null>(null);

export function useNav() {
  const v = useContext(NavCtx);
  if (!v) throw new Error('Nav context missing');
  return v;
}
