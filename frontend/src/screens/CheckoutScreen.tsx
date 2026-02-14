import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal } from 'react-native';
import { Text, Button, Card, Title, Paragraph, ActivityIndicator, Switch, IconButton } from 'react-native-paper';
import api from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

interface PointsData {
  availablePoints: number;
  equivalentUSD: string;
}

const CheckoutScreen = ({ route, navigation }: Props) => {
  const { plan } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [usePoints, setUsePoints] = useState(false);
  const [points, setPoints] = useState<PointsData | null>(null);

  // Paystack WebView State
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState('');
  const [paystackReference, setPaystackReference] = useState('');

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    try {
      setLoadingPoints(true);
      const response = await api.get('/points/balance');
      setPoints(response.data);
    } catch (error) {
      console.error('Error loading points:', error);
      setPoints({
        availablePoints: 0,
        equivalentUSD: '0.00',
      });
    } finally {
      setLoadingPoints(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!usePoints || !points) return plan.price;

    const pointsValue = parseFloat(points.equivalentUSD);
    const discounted = Math.max(0, plan.price - pointsValue);
    return discounted;
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const finalPrice = calculateFinalPrice();

      // 1. Initialize Payment (Paystack) if needed
      if (finalPrice > 0) {
        if (!user?.email) {
          Alert.alert('Error', 'User email required for payment');
          setLoading(false);
          return;
        }

        const initResponse = await api.post('/payments/paystack/initialize', {
          email: user.email,
          amount: finalPrice,
          currency: 'USD',
          planId: plan.iccid,
          callback_url: 'https://standard.paystack.co/close'
        });

        if (initResponse.data && initResponse.data.authorization_url) {
          setPaystackUrl(initResponse.data.authorization_url);
          setPaystackReference(initResponse.data.reference);
          setShowPaystackModal(true);
          setLoading(false);
          return; // Wait for WebView callback
        }
      }

      // If finalPrice is 0 (fully covered by points), call purchase directly
      await completePurchase(null);

    } catch (error: any) {
      console.error('Purchase/Init Error:', error);
      Alert.alert('Purchase Failed', error.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  };

  const completePurchase = async (reference: string | null) => {
    try {
      setLoading(true);
      const finalPrice = calculateFinalPrice();

      const response = await api.post('/esim/purchase', {
        iccid: plan.iccid,
        price: finalPrice,
        paymentMethod: reference ? 'paystack' : 'wallet',
        paymentId: reference,
        usePoints: usePoints
      });

      // Success! Navigate to Activation
      const { order_id, activation_url, activation_code, smdp_address } = response.data;

      Alert.alert('Success', 'eSIM Purchased & Activated successfully!', [
        {
          text: 'OK', onPress: () => navigation.navigate('Activation', {
            orderId: order_id,
            activationUrl: activation_url,
            activationCode: activation_code,
            smdpAddress: smdp_address
          })
        }
      ]);
      setLoading(false);
    } catch (error: any) {
      console.error('Complete Purchase Error:', error);
      Alert.alert('Purchase Failed', error.response?.data?.error || 'Failed to complete purchase');
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = (newNavState: any) => {
    const { url, title } = newNavState;
    if (!url) return;

    console.log('[Paystack WebView] URL:', url);
    console.log('[Paystack WebView] Title:', title);

    // Check for success or close callback
    if (
      url.includes('standard.paystack.co/close') ||
      url.includes('/payments/paystack/callback') ||
      url.includes('success=true') ||
      url === 'https://standard.paystack.co/close' ||
      (title && title.toLowerCase().includes('success'))
    ) {
      console.log('[Paystack WebView] Success detected, closing modal...');
      setShowPaystackModal(false);
      // Now actually call the purchase endpoint with the reference
      completePurchase(paystackReference);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Checkout</Title>

      <Card style={styles.card}>
        <Card.Title title="Order Summary" />
        <Card.Content>
          <Paragraph>Plan: {plan.region} {plan.dataLimit}</Paragraph>
          <Title>Original Price: ${plan.price.toFixed(2)}</Title>
        </Card.Content>
      </Card>

      {/* AIR Points Option */}
      {!loadingPoints && points && points.availablePoints > 0 && (
        <Card style={styles.pointsCard}>
          <Card.Content>
            <View style={styles.pointsHeader}>
              <Text style={styles.pointsTitle}>🎁 Use AIR Points</Text>
              <Switch
                value={usePoints}
                onValueChange={setUsePoints}
              />
            </View>
            {usePoints && (
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsText}>
                  Available: {points.availablePoints} points (${points.equivalentUSD})
                </Text>
                <Text style={styles.discountText}>
                  💰 Discount: ${(plan.price - calculateFinalPrice()).toFixed(2)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.paymentCard}>
        <Card.Title title="Payment Method" />
        <Card.Content>
          <Paragraph>Paystack / Card / Bank</Paragraph>
          <Title style={styles.finalPrice}>
            Final Price: ${calculateFinalPrice().toFixed(2)}
          </Title>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handlePurchase}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Pay & Activate
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.cancelButton}
        disabled={loading}
      >
        Cancel
      </Button>

      {/* Paystack WebView Modal */}
      <Modal
        visible={showPaystackModal}
        onRequestClose={() => setShowPaystackModal(false)}
        animationType="slide"
      >
        <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            <IconButton icon="close" onPress={() => setShowPaystackModal(false)} />
          </View>
          <WebView
            source={{ uri: paystackUrl }}
            style={{ flex: 1 }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            startInLoadingState
            renderLoading={() => <ActivityIndicator style={{ flex: 1 }} size="large" />}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20
  },
  card: {
    marginBottom: 20
  },
  pointsCard: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pointsInfo: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 4,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  paymentCard: {
    marginBottom: 30
  },
  finalPrice: {
    color: '#6200EE',
    marginTop: 8,
  },
  button: {
    paddingVertical: 8,
    marginBottom: 10
  },
  cancelButton: {
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    elevation: 2,
    marginTop: 40 // Safe area
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10
  }
});

export default CheckoutScreen;
