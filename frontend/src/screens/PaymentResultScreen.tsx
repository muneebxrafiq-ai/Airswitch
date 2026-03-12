import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import api from '../services/api';
import { COLORS, FONTS, SIZES, SPACING } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentResult'>;

const MAX_POLL_DURATION_MS = 90_000; // 90 seconds max
const POLL_INTERVAL_MS = 5_000; // Check every 5 seconds

const PaymentResultScreen = ({ route, navigation }: Props) => {
  const { reference } = route.params;
  const [status, setStatus] = useState<'polling' | 'success' | 'failed'>('polling');
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(MAX_POLL_DURATION_MS / 1000));
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());

  const cleanup = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  };

  const checkStatus = async () => {
    try {
      const { data } = await api.get(`/esim/paystack/status/${reference}`);

      if (data.status === 'SUCCESS') {
        cleanup();
        setStatus('success');
        return;
      }

      // If we've exceeded the max poll duration, show failed
      if (Date.now() - startTime.current > MAX_POLL_DURATION_MS) {
        cleanup();
        setStatus('failed');
      }
    } catch (e) {
      console.error('Payment status poll error:', e);
      // Don't fail immediately on network blip — keep polling
      if (Date.now() - startTime.current > MAX_POLL_DURATION_MS) {
        cleanup();
        setStatus('failed');
      }
    }
  };

  const startPolling = () => {
    setStatus('polling');
    startTime.current = Date.now();
    setSecondsLeft(Math.ceil(MAX_POLL_DURATION_MS / 1000));

    // Immediate first check
    checkStatus();

    // Poll every 3 seconds
    pollTimer.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    // Countdown display
    countdownTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, Math.ceil((MAX_POLL_DURATION_MS - elapsed) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current);
      }
    }, 1000);
  };

  useEffect(() => {
    startPolling();
    return cleanup;
  }, [reference]);

  if (status === 'polling') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.background, COLORS.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Confirming Payment</Text>
          <Text style={styles.subtitle}>
            Verifying your Paystack payment...
          </Text>
          <Text style={styles.countdown}>
            Checking... {secondsLeft}s remaining
          </Text>
          <Text style={styles.hint}>
            Please wait while we confirm your payment and provision your eSIM.
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.background, COLORS.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '20' }]}>
            <MaterialCommunityIcons name="check-circle" size={60} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Payment Successful! 🎉</Text>
          <Text style={styles.subtitle}>
            Your eSIM has been provisioned and is ready to use.
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyESims')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <MaterialCommunityIcons name="sim" size={20} color="white" />
              <Text style={styles.buttonText}>View My eSIMs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Failed / timeout state
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.error + '20' }]}>
          <MaterialCommunityIcons name="clock-alert-outline" size={60} color={COLORS.error} />
        </View>
        <Text style={styles.title}>Payment Pending</Text>
        <Text style={styles.subtitle}>
          We couldn't confirm your payment yet. This can happen if the payment is still processing.
        </Text>
        <Text style={styles.hint}>
          Don't worry — if your payment went through, your eSIM will appear in "My eSIMs" shortly.
        </Text>

        <TouchableOpacity
          onPress={startPolling}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Check Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MyESims')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>View My eSIMs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={[styles.secondaryButton, { marginTop: 8 }]}
        >
          <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: SIZES.h2,
    fontFamily: FONTS?.bold || 'System',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.m,
    lineHeight: 22,
  },
  countdown: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontFamily: FONTS?.medium,
    marginBottom: SPACING.s,
  },
  hint: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.l,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    minWidth: 220,
  },
  buttonText: {
    color: 'white',
    fontSize: SIZES.body,
    fontFamily: FONTS?.bold || 'System',
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: SPACING.m,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.small,
    fontFamily: FONTS?.medium,
  },
});

export default PaymentResultScreen;
