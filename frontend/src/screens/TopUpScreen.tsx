
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Title, Text, Button, Card, TextInput, useTheme } from 'react-native-paper';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TopUp'>;

const TopUpScreen = ({ navigation }: Props) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { refreshWallet } = useAuth();
    const [amount, setAmount] = useState('10');
    const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
    const [loading, setLoading] = useState(false);
    const [paystackReference, setPaystackReference] = useState<string | null>(null);
    const theme = useTheme();

    const handleTopUp = async () => {
        if (currency === 'USD') {
            await initializeStripe();
        } else {
            await initializePaystack();
        }
    };

    // --- STRIPE (USD) ---
    const initializeStripe = async () => {
        setLoading(true);
        try {
            const response = await api.post('/wallet/initiate-topup', {
                amount: parseFloat(amount),
                currency: 'usd',
            });
            const { clientSecret, id } = response.data;

            const { error } = await initPaymentSheet({
                merchantDisplayName: 'Airswitch',
                paymentIntentClientSecret: clientSecret,
                defaultBillingDetails: { name: 'Airswitch User' },
                allowsDelayedPaymentMethods: false,
            });

            if (!error) {
                await openStripeSheet(id);
            } else {
                Alert.alert('Stripe Error', error.message);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not initialize Stripe');
        } finally {
            setLoading(false);
        }
    };

    const openStripeSheet = async (paymentIntentId: string) => {
        const { error } = await presentPaymentSheet();
        if (error) {
            Alert.alert(`Payment Aborted`, error.message);
        } else {
            await confirmPaymentBackend(paymentIntentId, undefined, 'STRIPE');
        }
    };

    // --- PAYSTACK (NGN) ---
    const initializePaystack = async () => {
        setLoading(true);
        try {
            const response = await api.post('/wallet/initiate-topup', {
                amount: parseFloat(amount),
                currency: 'ngn',
            });

            const { authorization_url, reference } = response.data;
            setPaystackReference(reference);

            // Open Paystack in Browser
            // Ideally use WebBrowser, but Linking works for MVP
            const { Linking } = require('react-native');
            await Linking.openURL(authorization_url);

            Alert.alert(
                "Complete Payment",
                "Please complete the payment in your browser, then click 'I have paid' below.",
                [{ text: "OK" }]
            );

        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Could not initialize Paystack');
            setPaystackReference(null);
        } finally {
            setLoading(false);
        }
    };

    const verifyPaystack = async () => {
        if (!paystackReference) return;
        await confirmPaymentBackend(undefined, paystackReference, 'PAYSTACK');
    };

    // --- SHARED CONFIRMATION ---
    const confirmPaymentBackend = async (intentId?: string, reference?: string, provider?: string) => {
        setLoading(true);
        try {
            await api.post('/wallet/confirm-payment', {
                paymentIntentId: intentId,
                paymentReference: reference,
                provider
            });
            await refreshWallet();
            Alert.alert('Success', 'Wallet funded successfully!');
            navigation.goBack();
        } catch (err: any) {
            console.log(err);
            Alert.alert('Payment Status', 'Payment verification pending or failed. Please check your wallet shortly.');
            navigation.goBack(); // Or stay? Let's go back to avoid double processing attempts by user
        } finally {
            setLoading(false);
        }
    };

    // Constants
    const PRESET_USD = ['10', '20', '50', '100'];
    const PRESET_NGN = ['5000', '10000', '20000', '50000'];
    const presetAmounts = currency === 'USD' ? PRESET_USD : PRESET_NGN;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Title style={styles.title}>Top Up Wallet 💳</Title>
            <Text style={styles.subtitle}>Add funds via Card or Transfer</Text>

            {/* Currency Selector */}
            <View style={styles.currencyContainer}>
                <Button
                    mode={currency === 'USD' ? 'contained' : 'outlined'}
                    onPress={() => { setCurrency('USD'); setAmount('10'); setPaystackReference(null); }}
                    style={styles.currencyBtn}
                >
                    USD ($)
                </Button>
                <Button
                    mode={currency === 'NGN' ? 'contained' : 'outlined'}
                    onPress={() => { setCurrency('NGN'); setAmount('5000'); setPaystackReference(null); }}
                    style={styles.currencyBtn}
                >
                    NGN (₦)
                </Button>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.label}>Select Amount ({currency})</Text>
                    <View style={styles.presetContainer}>
                        {presetAmounts.map((val) => (
                            <Button
                                key={val}
                                mode={amount === val ? 'contained' : 'outlined'}
                                onPress={() => setAmount(val)}
                                style={styles.presetButton}
                            >
                                {currency === 'USD' ? '$' : '₦'}{val}
                            </Button>
                        ))}
                    </View>

                    <TextInput
                        label={`Amount in ${currency}`}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />
                </Card.Content>
            </Card>

            {!paystackReference ? (
                <Button
                    mode="contained"
                    onPress={handleTopUp}
                    style={styles.payButton}
                    loading={loading}
                    disabled={loading || !amount || parseFloat(amount) <= 0}
                >
                    {currency === 'USD' ? 'Pay with Stripe' : 'Pay with Paystack'}
                </Button>
            ) : (
                <View>
                    <Text style={{ textAlign: 'center', marginBottom: 10, color: 'blue' }}>
                        Payment started. Check your browser.
                    </Text>
                    <Button
                        mode="contained"
                        onPress={verifyPaystack}
                        style={[styles.payButton, { backgroundColor: 'green' }]}
                        loading={loading}
                    >
                        I have completed payment
                    </Button>
                    <Button mode="text" onPress={() => setPaystackReference(null)}>
                        Cancel
                    </Button>
                </View>
            )}

            <Button
                mode="text"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
            >
                Back
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    title: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 24,
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginTop: 8,
        marginBottom: 30,
    },
    card: {
        marginBottom: 20,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    presetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    presetButton: {
        width: '23%',
        marginBottom: 10,
    },
    input: {
        marginTop: 10,
    },
    payButton: {
        paddingVertical: 8,
        marginTop: 20,
    },
    cancelButton: {
        marginTop: 10,
    },
    currencyContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10 // React Native 0.71+ support
    },
    currencyBtn: {
        flex: 1,
        marginHorizontal: 5
    },
    verifyingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default TopUpScreen;
