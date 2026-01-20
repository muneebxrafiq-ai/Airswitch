import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Avatar, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen = ({ navigation }: Props) => {
    const { user, signOut } = useAuth();
    const [wallet, setWallet] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchWallet = async () => {
        try {
            const response = await api.get('/wallet');
            setWallet(response.data);
        } catch (error) {
            console.error('Error fetching wallet', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchWallet();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchWallet();
    }, []);

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Title>Hello, {user?.name || 'User'}!</Title>
                <Button icon="logout" onPress={signOut}>Logout</Button>
            </View>

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
                    {/* Logic to fund wallet would go here */}
                    <Button onPress={() => alert('Stripe Integration Pending')}>Fund Wallet</Button>
                </Card.Actions>
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
    }
});

export default DashboardScreen;
