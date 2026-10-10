import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData, ThemeMode } from '../types/models';
import { initialize, writeData } from '../repositories/local';

const empty: AppData = { profile: null, templates: [], exercises: [], favorites: [], sessions: [], runs: [], water: [], weights: [], foods: [], meals: [], recovery: [], activities: [], prices: [], mealPlans: [] };
let state = { data: empty, ready: false, error: '', theme: 'system' as ThemeMode, saving: false };
const listeners = new Set<() => void>();
function emit(patch: Partial<typeof state>) { state = { ...state, ...patch }; listeners.forEach(listener => listener()); }
export const useApp = () => useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => state, () => state);
let init: Promise<void> | undefined;
export function boot() {
  if (!init) init = (async () => {
    try {
      const data = await initialize();
      const theme = await AsyncStorage.getItem('forma.theme');
      emit({ data, ready: true, error: '', theme: theme === 'light' || theme === 'dark' ? theme : 'system' });
    } catch (error) { emit({ error: error instanceof Error ? error.message : 'Could not open local storage.' }); init = undefined; }
  })();
  return init;
}
let queue = Promise.resolve();
export function mutate(change: (data: AppData) => AppData): Promise<void> {
  const task = queue.catch(() => {}).then(async () => {
    emit({ saving: true });
    try { const data = await writeData(change(state.data)); emit({ data }); }
    finally { emit({ saving: false }); }
  });
  queue = task;
  return task;
}
export async function setTheme(theme: ThemeMode) { await AsyncStorage.setItem('forma.theme', theme); emit({ theme }); }
