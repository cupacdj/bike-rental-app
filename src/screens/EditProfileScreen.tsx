import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function EditProfileScreen() {
  const nav = useNav();
  const { currentUser, updateProfile } = useAppData();
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setPhone(currentUser.phone);
    setEmail(currentUser.email);
  }, [currentUser?.id]);

  async function onSave() {
    if (busy) return;
    setBusy(true);
    const ok = await updateProfile({ firstName, lastName, phone, email });
    setBusy(false);
    if (ok) nav.pop();
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Izmena profila" onBack={() => nav.pop()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="person" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Korisničko ime se ne može menjati</Text>
          </View>

          <AppInput label="Ime" value={firstName} onChangeText={setFirstName} autoCapitalize="words" icon="person-outline" />
          <AppInput label="Prezime" value={lastName} onChangeText={setLastName} autoCapitalize="words" icon="person-outline" />
          <AppInput label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" />
          <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" />

          <View style={{ height: 8 }} />
          <AppButton title={busy ? 'Čuvanje...' : 'Sačuvaj izmene'} onPress={onSave} disabled={busy} icon="checkmark-outline" />
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
  subtitle: { fontSize: 14 },
});
