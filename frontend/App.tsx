import React from 'react';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StripeProvider } from '@stripe/stripe-react-native';
import { COLORS } from './src/theme';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Sryy8GxNwAFuSTLubq5xraGxVEOMzlMh7VcSkbnpTqV5t7Ala4tLz6GaL9wonwktrHkTxvx0RhzmjffDDhpLmu600D177TncK';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
    onPrimary: COLORS.white,
    onSurface: COLORS.text,
  },
  fonts: {
    ...DefaultTheme.fonts,
    default: {
      fontFamily: 'Inter_400Regular',
      fontWeight: '400',
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: 'Inter_600SemiBold',
      fontWeight: '600',
      letterSpacing: 0.15,
      lineHeight: 24,
      fontSize: 16,
    },
    headlineMedium: {
      fontFamily: 'Inter_700Bold',
      fontWeight: '700',
      letterSpacing: 0,
      lineHeight: 36,
      fontSize: 28,
    },
    // We can map more as needed, but this covers basics
  }
};

import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <AuthProvider>
          <PaperProvider theme={theme}>
            <AppNavigator />
          </PaperProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
