import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@bike_rental_server_url_v1";

export async function getServerUrl(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function setServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEY, url.trim());
}

export async function clearServerUrl(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
