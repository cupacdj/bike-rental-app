import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function ChangePasswordScreen() {
  const nav = useNav();
  const { changePassword } = useAppData();
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (busy) return;
    setBusy(true);
    const ok = await changePassword({ currentPassword, newPassword, confirmNewPassword: confirm });
    setBusy(false);
    if (ok) nav.pop();
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Promena lozinke" onBack={() => nav.pop()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Unesite trenutnu i novu lozinku</Text>
          </View>

          <AppInput label="Trenutna lozinka" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry icon="lock-closed-outline" />
          <AppInput label="Nova lozinka" value={newPassword} onChangeText={setNewPassword} secureTextEntry icon="lock-open-outline" />
          <AppInput label="Potvrda nove lozinke" value={confirm} onChangeText={setConfirm} secureTextEntry icon="lock-open-outline" />

          <View style={{ height: 8 }} />
          <AppButton title={busy ? 'Čuvanje...' : 'Promeni lozinku'} onPress={onSave} disabled={busy} icon="checkmark-outline" />
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
