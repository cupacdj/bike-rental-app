import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function RegisterScreen() {
  const nav = useNav();
  const { register } = useAppData();
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onRegister() {
    if (busy) return;
    setBusy(true);
    const ok = await register({ firstName, lastName, phone, email, username, password, confirmPassword });
    setBusy(false);
    if (ok) nav.pop();
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Registracija" onBack={() => nav.pop()} />
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="person-add" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.h1, { color: theme.textPrimary }]}>Novi nalog</Text>
            <Text style={[styles.p, { color: theme.textMuted }]}>Unesite podatke i kreirajte korisnički nalog</Text>
          </View>

          <AppInput label="Ime" value={firstName} onChangeText={setFirstName} placeholder="npr. Marko" autoCapitalize="words" icon="person-outline" />
          <AppInput label="Prezime" value={lastName} onChangeText={setLastName} placeholder="npr. Marković" autoCapitalize="words" icon="person-outline" />
          <AppInput label="Telefon" value={phone} onChangeText={setPhone} placeholder="+381 6X..." keyboardType="phone-pad" icon="call-outline" />
          <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="ime@domen.com" keyboardType="email-address" autoCapitalize="none" icon="mail-outline" />
          <AppInput label="Korisničko ime" value={username} onChangeText={setUsername} placeholder="npr. marko123" autoCapitalize="none" icon="at-outline" />
          <AppInput label="Lozinka" value={password} onChangeText={setPassword} placeholder="min 6 karaktera" secureTextEntry icon="lock-closed-outline" />
          <AppInput label="Potvrda lozinke" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="ponovi lozinku" secureTextEntry icon="lock-closed-outline" />

          <View style={{ height: 8 }} />
          <AppButton title={busy ? 'Kreiranje...' : 'Kreiraj nalog'} onPress={onRegister} disabled={busy} icon="checkmark-circle-outline" />
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  h1: { fontSize: 24, fontWeight: '800' },
  p: { marginTop: 6, textAlign: 'center' },
});
