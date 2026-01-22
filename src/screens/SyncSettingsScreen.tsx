import React, { useEffect, useState } from "react";
import { Alert, View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { clearServerUrl, getServerUrl, setServerUrl } from "../services/syncConfig";
import { AppButton } from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';
import { useAppData } from '../contexts/AppDataContext';
import { useNav } from '../navigation/NavContext';

export default function SyncSettingsScreen({ onDone }: { onDone?: () => void }) {
  const { theme } = useTheme();
  const nav = useNav();
  const { isOnline, refreshFromServer, state } = useAppData();
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await getServerUrl();
      setUrl(v ?? "");
      setLoaded(true);
    })();
  }, []);

  const save = async () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) {
      Alert.alert("Greška", "URL mora početi sa http:// ili https://");
      return;
    }
    await setServerUrl(u);
    Alert.alert("Sačuvano", "Server URL je sačuvan. Osvežavanje podataka...");
    // Refresh data from server after saving
    setRefreshing(true);
    await refreshFromServer();
    setRefreshing(false);
    onDone?.();
  };

  const clear = async () => {
    await clearServerUrl();
    setUrl("");
    Alert.alert("Obrisano", "Server URL je obrisan. Aplikacija koristi lokalne podatke.");
  };

  const handleRefresh = async () => {
    if (!url.trim()) {
      Alert.alert("Greška", "Prvo unesite Server URL");
      return;
    }
    setRefreshing(true);
    await refreshFromServer();
    setRefreshing(false);
    Alert.alert("Osveženo", "Podaci su uspešno sinhronizovani sa serverom.");
  };

  if (!loaded) return null;

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      {/* Header with back button */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => nav.pop()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Sync Settings</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="cloud-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.help, { color: theme.textMuted }]}>Unesi URL lokalnog servera (LAN IP)</Text>
          </View>

          {/* Connection Status */}
          <View style={[styles.statusCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={isOnline ? "cloud-done" : "cloud-offline"} 
                size={24} 
                color={isOnline ? "#22c55e" : "#ef4444"} 
              />
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: theme.textPrimary }]}>
                  {isOnline ? "Povezano sa serverom" : "Nije povezano"}
                </Text>
                <Text style={[styles.statusSubtitle, { color: theme.textMuted }]}>
                  {isOnline 
                    ? `${state.bikes.length} bicikala, ${state.parkingZones.length} zona`
                    : "Koriste se lokalni podaci"
                  }
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Server URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.x.x:5000"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ height: 16 }} />
          <AppButton title="Sačuvaj" onPress={save} icon="save-outline" />
          <View style={{ height: 10 }} />
          
          {/* Refresh Button */}
          <AppButton 
            title={refreshing ? "Osvežavanje..." : "Osveži podatke sa servera"} 
            onPress={handleRefresh} 
            variant="secondary" 
            icon="refresh-outline"
            disabled={refreshing}
          />
          {refreshing && (
            <ActivityIndicator style={{ marginTop: 10 }} color={theme.primary} />
          )}
          
          <View style={{ height: 10 }} />
          <AppButton title="Obriši URL" onPress={clear} variant="ghost" icon="trash-outline" />

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              Server URL je adresa admin-web servera. Kada je povezano, bicikli i parking zone koje admin dodaje će biti vidljivi u aplikaciji.
            </Text>
          </View>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  help: { marginTop: 6, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  statusCard: { 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 20 
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  statusText: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '600' },
  statusSubtitle: { fontSize: 13, marginTop: 2 },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
