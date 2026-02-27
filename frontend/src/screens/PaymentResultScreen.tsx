import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import api from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentResult'>;

const PaymentResultScreen = ({ route, navigation }: Props) => {
  const { reference } = route.params;
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get(`/esim/paystack/status/${reference}`);
        if (!mounted) return;

        if (data.status === 'SUCCESS') {
          setStatus('success');
        } else {
          setStatus('pending');
        }
      } catch (e) {
        console.error('Payment status error', e);
        if (mounted) setStatus('failed');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [reference]);

  if (status === 'loading' || status === 'pending') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Confirming your payment...</Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>Payment successful!</Text>
        <Button mode="contained" onPress={() => navigation.navigate('MyESims')}>
          View my eSIMs
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>Could not confirm payment.</Text>
      <Button mode="outlined" onPress={() => navigation.navigate('MyESims')}>
        Back to eSIMs
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default PaymentResultScreen;

