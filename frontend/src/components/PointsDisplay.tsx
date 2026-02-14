import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import api from '../services/api';

interface PointsData {
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  equivalentUSD: string;
}

interface PointsDisplayProps {
  onRedeemPress?: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PointsDisplay = ({ onRedeemPress }: PointsDisplayProps) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/points/balance');
      setPoints(response.data);
    } catch (error) {
      console.error('Error loading points:', error);
      // Gracefully handle offline scenario - show 0 points
      setPoints({
        totalPoints: 0,
        availablePoints: 0,
        redeemedPoints: 0,
        equivalentUSD: '0.00',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  if (!points) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>🎁 AIR Points</Text>
          <Text style={styles.subtitle}>Earned from referrals & purchases</Text>
        </View>

        <View style={styles.pointsDisplay}>
          <View style={styles.mainPoints}>
            <Text style={styles.pointsValue}>{points.availablePoints}</Text>
            <Text style={styles.pointsLabel}>Available Points</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.valueInfo}>
            <Text style={styles.equivalentValue}>${points.equivalentUSD}</Text>
            <Text style={styles.equivalentLabel}>USD Value</Text>
          </View>
        </View>

        {points.redeemedPoints > 0 && (
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              💰 Redeemed: {points.redeemedPoints} points
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ReferralsScreen')}
            style={styles.button}
          >
            📤 Earn More
          </Button>
          <Button
            mode="contained"
            onPress={onRedeemPress}
            style={styles.button}
          >
            💳 Redeem
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#f9f9f9',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  pointsDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mainPoints: {
    flex: 1,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  valueInfo: {
    flex: 1,
    alignItems: 'center',
  },
  equivalentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  equivalentLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statsRow: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statText: {
    fontSize: 13,
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default PointsDisplay;
