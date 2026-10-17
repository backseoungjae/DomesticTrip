import { useColorScheme } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 12, md: 20, pill: 999 } as const;
export const typography = {
  title: { fontSize: 30, lineHeight: 39, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 29, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400' },
  label: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
} as const;

const light = {
  background: '#F7F6F2',
  surface: '#FFFFFF',
  text: '#192F2A',
  muted: '#596961',
  primary: '#245E4F',
  onPrimary: '#FFFFFF',
  tint: '#E5EFE7',
  border: '#CDD8D0',
  accent: '#9A491C',
  danger: '#A52B34',
};
const dark: typeof light = {
  background: '#14221E',
  surface: '#1F312B',
  text: '#F1F5EF',
  muted: '#BBCBC2',
  primary: '#B3DEC5',
  onPrimary: '#15372C',
  tint: '#2C483A',
  border: '#496056',
  accent: '#F5B585',
  danger: '#FFB3B8',
};

export function useColors() {
  return useColorScheme() === 'dark' ? dark : light;
}
