import { useColorScheme } from 'react-native';
import { palettes } from '../constants/theme';
import { useApp } from '../stores/app';

export function useTheme() {
  const { theme } = useApp();
  const system = useColorScheme();
  return palettes[theme === 'system' ? system === 'light' ? 'light' : 'dark' : theme];
}
