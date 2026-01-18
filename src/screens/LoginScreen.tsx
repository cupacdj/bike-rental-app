import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Screen } from '../components/Screen';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function LoginScreen() {
  const nav = useNav();
  const { login } = useAppData();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    if (busy) return;
    setBusy(true);
    const ok = await login(username, password);
    setBusy(false);
    if (ok) nav.resetToTabs('Map');
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <Screen>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="bicycle" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.h1, { color: theme.textPrimary }]}>BikeRent</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Iznajmite bicikl u par klikova</Text>
        </View>

        <View style={styles.form}>
          <AppInput 
            label="Korisničko ime" 
            value={username} 
            onChangeText={setUsername} 
            autoCapitalize="none"
            icon="person-outline"
          />
          <AppInput 
            label="Lozinka" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry
            icon="lock-closed-outline"
          />

          <View style={{ height: 8 }} />
          <AppButton title={busy ? 'Prijava...' : 'Prijavi se'} onPress={onLogin} disabled={busy} icon="log-in-outline" />

          <View style={{ height: 16 }} />
          <AppButton title="Nemate nalog? Registracija" onPress={() => nav.push({ name: 'Register' })} variant="ghost" icon="person-add-outline" />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  iconWrap: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16,
  },
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 8 },
  form: { flex: 1 },
});
