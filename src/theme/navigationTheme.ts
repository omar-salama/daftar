import { DefaultTheme, DarkTheme } from 'expo-router';

export const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f9f9ff',
  },
};

export const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#10131a',
  },
};
