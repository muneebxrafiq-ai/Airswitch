import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Divider,
  List,
  useTheme,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import api from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralsScreen'>;

interface Referral {
  id: string;
  status: string;
  email: string;
  name: string;
  pointsAwarded: number;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  commission: number;
}

interface Progress {
  completed: number;
  pending: number;
  totalPoints: number;
  totalBonus: number;
  referrals: Referral[];
}

const ReferralsScreen = ({ navigation }: Props) => {
  const theme = useTheme();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReferralData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [codeRes, progressRes] = await Promise.all([
        api.get('/referrals/code'),
        api.get('/referrals/progress'),
      ]);

      setReferralData(codeRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!referralData) return;

    try {
      const message = `Join Airswitch and get free eSIM credits! Use my referral code: ${referralData.referralCode} and both of us earn AIR Points!`;

      await Share.share({
        message,
        url: undefined,
        title: 'Join Airswitch',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!referralData) return;
    Clipboard.setString(referralData.referralCode);
    Alert.alert('Success', 'Referral code copied to clipboard!');
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setInviting(true);
      await api.post('/referrals/invite', {
        inviteeEmail: inviteEmail.trim(),
      });

      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      loadReferralData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Referral Code Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <Text style={styles.referralCode}>{referralData?.referralCode}</Text>
          <Text style={styles.subtext}>Share this code with friends to earn AIR Points</Text>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleCopyCode}
              style={styles.halfButton}
            >
              Copy Code
            </Button>
            <Button
              mode="contained"
              onPress={handleShare}
              style={styles.halfButton}
            >
              Share
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Commission Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <List.Item
            title="Commission Rate"
            description={`${referralData?.commission}% per referral`}
            left={(props) => <List.Icon {...props} icon="percent" />}
          />
          <List.Item
            title="Earn Points"
            description="500 AIR Points per successful referral"
            left={(props) => <List.Icon {...props} icon="star" />}
          />
          <List.Item
            title="Use Points"
            description="Redeem points for subscription discounts"
            left={(props) => <List.Icon {...props} icon="gift" />}
          />
        </Card.Content>
      </Card>

      {/* Earnings Summary */}
      {progress && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Your Earnings</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{progress.completed}</Text>
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{progress.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{progress.totalPoints}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Invite Via Email */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Invite via Email</Text>
          <Text style={styles.subtext}>
            Enter email addresses to send personalized invitations
          </Text>
          <View style={styles.inviteRow}>
            <Text>📧</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleInvite}
            loading={inviting}
            disabled={inviting}
          >
            Send Invitation
          </Button>
        </Card.Content>
      </Card>

      {/* Referral History */}
      {progress && progress.referrals.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Referral History</Text>
            {progress.referrals.map((ref, index) => (
              <View key={ref.id}>
                <List.Item
                  title={ref.name}
                  description={ref.email}
                  right={(props) => (
                    <View style={styles.statusBadge}>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              ref.status === 'COMPLETED'
                                ? '#4CAF50'
                                : '#FF9800',
                          },
                        ]}
                      >
                        {ref.status === 'COMPLETED' ? '✓' : '⏳'} {ref.pointsAwarded} pts
                      </Text>
                    </View>
                  )}
                />
                {index < progress.referrals.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* No Referrals Yet */}
      {progress && progress.referrals.length === 0 && (
        <Card style={styles.card}>
          <Card.Content style={styles.emptyState}>
            <Text style={styles.emptyText}>No referrals yet</Text>
            <Text style={styles.subtext}>
              Share your referral code to earn AIR Points!
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  referralCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default ReferralsScreen;
