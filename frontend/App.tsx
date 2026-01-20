import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f6f6f6',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <AppNavigator />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
