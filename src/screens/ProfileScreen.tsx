import React from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function ProfileScreen() {
  const nav = useNav();
  const { currentUser, logout, resetAllLocalData } = useAppData();
  const { theme } = useTheme();

  if (!currentUser) {
    return (
      <View style={[styles.full, { backgroundColor: theme.background }]}>
        <View style={styles.empty}>
          <Ionicons name="person-circle" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Niste prijavljeni</Text>
        </View>
      </View>
    );
  }

  const menuItems = [
    { icon: 'person-outline', label: 'Izmeni lične podatke', onPress: () => nav.push({ name: 'EditProfile' }) },
    { icon: 'lock-closed-outline', label: 'Promeni lozinku', onPress: () => nav.push({ name: 'ChangePassword' }) },
    { icon: 'cloud-outline', label: 'Sync Settings', onPress: () => nav.push({ name: 'SyncSettings' }) },
  ];

  return (
    <ScrollView style={[styles.full, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {currentUser.firstName[0]}{currentUser.lastName[0]}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{currentUser.firstName} {currentUser.lastName}</Text>
        <Text style={[styles.username, { color: theme.textMuted }]}>@{currentUser.username}</Text>
      </View>

      {/* Contact Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textPrimary }]}>{currentUser.email}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textPrimary }]}>{currentUser.phone}</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
              <Ionicons name={item.icon as any} size={22} color={theme.textSecondary} />
              <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </TouchableOpacity>
            {index < menuItems.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
          </React.Fragment>
        ))}
      </View>

      <View style={{ height: 24 }} />
      <AppButton
        title="Izloguj se"
        onPress={() => {
          Alert.alert('Izloguj se', 'Da li ste sigurni?', [
            { text: 'Otkaži', style: 'cancel' },
            { text: 'Izloguj se', style: 'destructive', onPress: () => logout() },
          ]);
        }}
        variant="danger"
        icon="log-out-outline"
      />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  content: { padding: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16 },
  profileCard: { 
    borderRadius: 24, 
    padding: 32, 
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800' },
  username: { fontSize: 15, marginTop: 4 },
  infoCard: { borderRadius: 16, padding: 4, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoText: { fontSize: 15, flex: 1 },
  divider: { height: 1 },
  menuCard: { borderRadius: 16, padding: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuLabel: { fontSize: 15, flex: 1 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 24 },
});
