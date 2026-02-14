import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Avatar, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PointsDisplay from '../components/PointsDisplay';
import PointsRedemptionModal from '../components/PointsRedemptionModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen = ({ navigation }: Props) => {
    const { user, signOut, refreshWallet } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(!user);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [availablePoints, setAvailablePoints] = useState(0);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshWallet();
        } finally {
            setRefreshing(false);
        }
    }, [refreshWallet]);

    useEffect(() => {
        if (!user) {
            refreshWallet().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadPoints = useCallback(async () => {
        try {
            const response = await api.get('/points/balance');
            setAvailablePoints(response.data.availablePoints);
        } catch (error) {
            console.error('Error loading points:', error);
            setAvailablePoints(0);
        }
    }, []);

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    const wallet = user?.wallet;

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Title>Hello, {user?.name || 'User'}!</Title>
                <View style={{ flexDirection: 'row' }}>
                    <Button icon="cog" onPress={() => { }} compact>Settings</Button>
                    <Button icon="logout" onPress={signOut} compact>Logout</Button>
                </View>
            </View>

            {/* AIR Points Section */}
            <PointsDisplay onRedeemPress={() => {
                loadPoints();
                setShowRedeemModal(true);
            }} />

            <Card style={styles.card}>
                <Card.Title
                    title="Your Wallet"
                    left={(props) => <Avatar.Icon {...props} icon="wallet" />}
                />
                <Card.Content>
                    <View style={styles.balanceRow}>
                        <View>
                            <Paragraph>USD Balance</Paragraph>
                            <Title>${wallet?.balanceUSD || '0.00'}</Title>
                        </View>
                        <View>
                            <Paragraph>NGN Balance</Paragraph>
                            <Title>₦{wallet?.balanceNGN || '0.00'}</Title>
                        </View>
                    </View>
                </Card.Content>
                <Card.Actions>
                    {/* Logic to fund wallet using Stripe */}
                    <Button onPress={() => navigation.navigate('TopUp')}>Fund Wallet</Button>
                    <Button onPress={() => navigation.navigate('MyESims')}>My eSIMs</Button>
                    <Button mode="contained" onPress={() => navigation.navigate('SelectPlan', { phone_number: '+1234567890' })}>Buy New eSIM</Button>
                </Card.Actions>
            </Card>

            {/* Active Plans Widget */}
            <Title style={styles.sectionTitle}>Active Plans</Title>
            <Card style={styles.activePlanCard} onPress={() => navigation.navigate('MyESims')}>
                <Card.Content>
                    <View style={styles.activePlanRow}>
                        <View>
                            <Title style={{ fontSize: 18 }}>Global Data</Title>
                            <Paragraph style={{ color: 'green' }}>Active • 2.1GB left</Paragraph>
                        </View>
                        <Avatar.Icon size={40} icon="signal" style={{ backgroundColor: '#e0f2f1' }} color="#009688" />
                    </View>
                    <Paragraph style={{ marginTop: 10, fontSize: 12, color: '#666' }}>Exp: 24 Jan 2026</Paragraph>
                </Card.Content>
            </Card>

            <Title style={styles.sectionTitle}>Buy eSIM</Title>
            {/* Placeholder for eSIM list */}
            <Card style={styles.esimCard}>
                <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
                <Card.Title title="Global Data Plan" subtitle="1GB - 30 Days" />
                <Card.Actions>
                    <Button onPress={() => navigation.navigate('Checkout', { plan: { iccid: '890000000001', region: 'Global', dataLimit: '1GB', price: 5.00 } })}>Buy for $5.00</Button>
                </Card.Actions>
            </Card>

            <Card style={styles.esimCard}>
                <Card.Title title="USA Data Plan" subtitle="3GB - 30 Days" />
                <Card.Actions>
                    <Button onPress={() => navigation.navigate('Checkout', { plan: { iccid: '890000000002', region: 'USA', dataLimit: '3GB', price: 10.00 } })}>Buy for $10.00</Button>
                </Card.Actions>
            </Card>

            {/* Points Redemption Modal */}
            <PointsRedemptionModal
                visible={showRedeemModal}
                onDismiss={() => setShowRedeemModal(false)}
                availablePoints={availablePoints}
                onSuccess={onRefresh}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    card: {
        marginBottom: 20,
        elevation: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
    },
    sectionTitle: {
        marginTop: 10,
        marginBottom: 10
    },
    esimCard: {
        marginBottom: 15
    },
    activePlanCard: {
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#009688',
    },
    activePlanRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});

export default DashboardScreen;
