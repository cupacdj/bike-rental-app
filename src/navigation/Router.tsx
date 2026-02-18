import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabs, TabKey } from '../components/BottomTabs';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { NavCtx, Nav, Route, useNav } from './NavContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MapScreen } from '../screens/MapScreen';
import { BikeDetailsScreen } from '../screens/BikeDetailsScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { ActiveRentalScreen } from '../screens/ActiveRentalScreen';
import { CaptureReturnPhotoScreen } from '../screens/CaptureReturnPhotoScreen';
import { RentalSummaryScreen } from '../screens/RentalSummaryScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RentalDetailsScreen } from '../screens/RentalDetailsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { ReportIssueScreen } from '../screens/ReportIssueScreen';
import SyncSettingsScreen from '../screens/SyncSettingsScreen';
import { ParkingZoneDetailsScreen } from '../screens/ParkingZoneDetailsScreen';
import { useTheme } from '../contexts/ThemeContext';

export function Router() {
  const { ready, currentUser } = useAppData();
  const { theme } = useTheme();
  const [stack, setStack] = useState<Route[]>([{ name: 'Login' }]);
  const route = stack[stack.length - 1];

  // keep auth state in sync
  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      setStack([{ name: 'Login' }]);
    } else {
      setStack([{ name: 'Tabs', tab: 'Map' }]);
    }
  }, [ready, currentUser?.id]);

  const nav = useMemo<Nav>(() => {
    return {
      route,
      push: (r) => setStack((s) => [...s, r]),
      pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      resetToTabs: (tab) => setStack([{ name: 'Tabs', tab: tab ?? 'Map' }]),
      setTab: (tab) =>
        setStack((s) => {
          const base: Route = { name: 'Tabs', tab };
          // if current top is Tabs, replace
          if (s.length === 1 && s[0].name === 'Tabs') return [base];
          // otherwise push tabs as root and drop modals
          return [base];
        }),
    };
  }, [route]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
          <View style={[styles.loading, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavCtx.Provider value={nav}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
          {route.name === 'Login' && <LoginScreen />}
          {route.name === 'Register' && <RegisterScreen />}

          {route.name === 'Tabs' && <Tabs tab={route.tab} />}

          {route.name === 'BikeDetails' && <BikeDetailsScreen bikeId={route.bikeId} />}
          {route.name === 'ParkingZoneDetails' && <ParkingZoneDetailsScreen zoneId={route.zoneId} />}
          {route.name === 'QRScanner' && <QRScannerScreen />}
          {route.name === 'CaptureReturnPhoto' && (
            <CaptureReturnPhotoScreen rentalId={route.rentalId} endLat={route.endLat} endLng={route.endLng} />
          )}
          {route.name === 'RentalSummary' && <RentalSummaryScreen rentalId={route.rentalId} />}
          {route.name === 'RentalDetails' && <RentalDetailsScreen rentalId={route.rentalId} />}
          {route.name === 'EditProfile' && <EditProfileScreen />}
          {route.name === 'ChangePassword' && <ChangePasswordScreen />}
          {route.name === 'ReportIssue' && <ReportIssueScreen bikeId={route.bikeId} rentalId={route.rentalId} />}
          {route.name === 'SyncSettings' && <SyncSettingsScreen onDone={() => nav.pop()} />}
        </SafeAreaView>
      </NavCtx.Provider>
    </SafeAreaProvider>
  );
}

function Tabs({ tab }: { tab: TabKey }) {
  const nav = useNav();
  const { mode, theme, toggleTheme } = useTheme();
  
  const isProfile = tab === 'Profile';
  
  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar 
        title={tabTitle(tab)} 
        rightIcon={isProfile ? (mode === 'dark' ? 'sunny' : 'moon') : undefined}
        onRightPress={isProfile ? toggleTheme : undefined}
      />
      <View style={styles.body}>
        {tab === 'Map' && <MapScreen />}
        {tab === 'Active' && <ActiveRentalScreen />}
        {tab === 'History' && <HistoryScreen />}
        {tab === 'Notifs' && <NotificationsScreen />}
        {tab === 'Profile' && <ProfileScreen />}
      </View>
      <BottomTabs tab={tab} onSelect={(t) => nav.setTab(t)} />
    </View>
  );
}

function tabTitle(t: TabKey) {
  switch (t) {
    case 'Map':
      return 'Mapa bicikala';
    case 'Active':
      return 'Aktivno iznajmljivanje';
    case 'History':
      return 'Istorija';
    case 'Notifs':
      return 'Obaveštenja';
    case 'Profile':
      return 'Profil';
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  full: { flex: 1 },
  body: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
