import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Card,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import api from '../services/api';

interface PointsRedemptionModalProps {
  visible: boolean;
  onDismiss: () => void;
  availablePoints: number;
  onSuccess: () => void;
}

const PointsRedemptionModal = ({
  visible,
  onDismiss,
  availablePoints,
  onSuccess,
}: PointsRedemptionModalProps) => {
  const theme = useTheme();
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  const pointsToUSD = 100; // 100 points = $1 USD

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem);

    if (!points || points <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (points > availablePoints) {
      Alert.alert('Error', 'Insufficient points');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/points/redeem', {
        pointsToRedeem: points,
        currency,
      });

      Alert.alert(
        'Success',
        `You've redeemed ${points} points for ${response.data.creditAmount} ${currency}!`
      );
      setPointsToRedeem('');
      onSuccess();
      onDismiss();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to redeem points'
      );
    } finally {
      setLoading(false);
    }
  };

  const estimatedValue = Math.floor(parseInt(pointsToRedeem || '0') / pointsToUSD * 100) / 100;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <Card.Content>
            <Text style={styles.title}>Redeem AIR Points</Text>

            {/* Points Input */}
            <TextInput
              label="Points to Redeem"
              placeholder="e.g., 100"
              value={pointsToRedeem}
              onChangeText={setPointsToRedeem}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

            {/* Currency Selection */}
            <Text style={styles.label}>Redeem as:</Text>
            <SegmentedButtons
              value={currency}
              onValueChange={setCurrency}
              buttons={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'NGN', label: 'NGN (₦)' },
              ]}
              style={styles.currencyButtons}
            />

            {/* Estimation */}
            {pointsToRedeem && (
              <View style={styles.estimationBox}>
                <Text style={styles.estimationText}>
                  💰 You'll get approximately {estimatedValue} {currency}
                </Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📊 Available: {availablePoints} points
              </Text>
              <Text style={styles.infoText}>
                💱 Conversion: 100 points = $1 USD
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.button}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleRedeem}
                loading={loading}
                disabled={loading || !pointsToRedeem}
                style={styles.button}
              >
                {loading ? 'Redeeming...' : 'Redeem Now'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  currencyButtons: {
    marginBottom: 16,
  },
  estimationBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  estimationText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default PointsRedemptionModal;
