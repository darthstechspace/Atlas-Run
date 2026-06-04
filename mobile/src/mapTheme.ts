import AsyncStorage from '@react-native-async-storage/async-storage';

export type MapTheme = 'dark' | 'light';

const STORAGE_KEY = '@atlasrun/mapTheme';

export async function loadMapTheme(): Promise<MapTheme> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export async function saveMapTheme(theme: MapTheme): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, theme);
}
