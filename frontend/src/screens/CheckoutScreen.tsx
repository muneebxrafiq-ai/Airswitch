import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import api from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const CheckoutScreen = ({ route, navigation }: Props) => {
    const { plan } = route.params;
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        try {
            // Logic to check balance or prompt Stripe would go here.
            // For MVP, we assume balance is sufficient or auto-fund via Mock Stripe if needed.
            // But based on backend logic, we deduct from wallet.

            await api.post('/esim/purchase', {
                iccid: plan.iccid,
                price: plan.price
            });

            Alert.alert('Success', 'eSIM Purchased & Activated successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
            ]);
        } catch (error: any) {
            Alert.alert('Purchase Failed', error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Checkout</Title>

            <Card style={styles.card}>
                <Card.Title title="Order Summary" />
                <Card.Content>
                    <Paragraph>Plan: {plan.region} {plan.dataLimit}</Paragraph>
                    <Title>Total: ${plan.price.toFixed(2)}</Title>
                </Card.Content>
            </Card>

            <Card style={styles.paymentCard}>
                <Card.Title title="Payment Method" />
                <Card.Content>
                    <Paragraph>Wallet Balance (USD)</Paragraph>
                    {/* In a real app we'd check balance here again */}
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
    paymentCard: {
        marginBottom: 30
    },
    button: {
        paddingVertical: 8,
        marginBottom: 10
    },
    cancelButton: {
    }
});

export default CheckoutScreen;
