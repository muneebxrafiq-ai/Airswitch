import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as telnyxService from '../services/telnyx';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { FONTS, COLORS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectPlan'>;

const SelectPlanScreen = ({ navigation, route }: Props) => {
    const { user } = useAuth();
    const { phone_number } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            if (phone_number) {
                await telnyxService.verifyPhoneNumber(phone_number);
            }

            const response = await api.get('/esim/plans');
            console.log('Fetched Plans Response:', response.status, response.data);

            let fetchedPlans = response.data;
            if (!Array.isArray(fetchedPlans)) {
                console.error("fetchedPlans is not an array:", fetchedPlans);
                throw new Error("Invalid API response format");
            }

            const targetCountry = (route.params as any)?.country;
            if (targetCountry) {
                fetchedPlans = fetchedPlans.filter((p: any) =>
                    p.country?.toLowerCase() === targetCountry.toLowerCase() ||
                    p.region?.toLowerCase() === targetCountry.toLowerCase() ||
                    p.name?.toLowerCase().includes(targetCountry.toLowerCase())
                );
            }
            setPlans(fetchedPlans);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to fetch available plans');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (plan: any) => {
        const title = "Choose Payment Method";
        const message = `How would you like to pay for ${plan.name}?`;

        Alert.alert(
            title,
            message,
            [
                {
                    text: "Card (Stripe)",
                    onPress: () => processStripePayment(plan)
                },
                {
                    text: "Paystack",
                    onPress: () => processPaystackPayment(plan)
                },
                {
                    text: "Wallet balance",
                    onPress: () => processWalletPayment(plan)
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const processWalletPayment = async (plan: any) => {
        setPurchasing(true);
        try {
            const balance = plan.currency === 'NGN' ? user?.wallet?.balanceNGN : user?.wallet?.balanceUSD;
            if (balance < plan.price) {
                throw new Error(`Insufficient ${plan.currency} balance in your wallet.`);
            }

            const purchaseResult = await telnyxService.purchaseESim(plan.id, plan.price, undefined, 'wallet');

            navigation.navigate('Activation', {
                orderId: purchaseResult.order_id,
                activationUrl: purchaseResult.activation_url,
                activationCode: purchaseResult.activation_code
            });
        } catch (error: any) {
            Alert.alert('Payment Failed', error.response?.data?.error || error.message || 'Something went wrong');
        } finally {
            setPurchasing(false);
        }
    };

    const processPaystackPayment = async (plan: any) => {
        setPurchasing(true);
        try {
            const EXCHANGE_RATE = 1600;
            let paystackAmount = plan.price;
            let paystackCurrency = plan.currency;

            if (plan.currency === 'USD') {
                paystackAmount = plan.price * EXCHANGE_RATE;
                paystackCurrency = 'NGN';
            }

            const { data } = await api.post('/payments/paystack/initialize', {
                amount: paystackAmount,
                email: user?.email || 'user@example.com',
                currency: paystackCurrency,
                planId: plan.id
            });

            const { authorization_url } = data;

            const supported = await Linking.canOpenURL(authorization_url);
            if (supported) {
                await Linking.openURL(authorization_url);
            } else {
                throw new Error("Cannot open payment link");
            }
        } catch (error: any) {
            Alert.alert('Payment Initialization Failed', error.message || 'Something went wrong');
        } finally {
            setPurchasing(false);
        }
    };

    const processStripePayment = async (plan: any) => {
        setPurchasing(true);
        try {
            const { data } = await api.post('/payments/create-payment-intent', {
                amount: plan.price,
                currency: plan.currency.toLowerCase(),
                planId: plan.id
            });

            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: data.clientSecret,
                merchantDisplayName: 'Airswitch eSIM',
            });

            if (initError) throw new Error(initError.message);

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === 'Canceled') {
                    setPurchasing(false);
                    return;
                }
                throw new Error(presentError.message);
            }

            const purchaseResult = await telnyxService.purchaseESim(plan.id, plan.price, data.id, 'stripe');

            navigation.navigate('Activation', {
                orderId: purchaseResult.order_id,
                activationUrl: purchaseResult.activation_url,
                activationCode: purchaseResult.activation_code
            });

        } catch (error: any) {
            Alert.alert('Payment Failed', error.message || 'Something went wrong');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <LinearGradient
                    colors={['#FFE2D1', '#FFF5F0', '#FFFFFF']}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color="#0052FF" />
                <Text style={styles.loadingText}>Fetching best plans for you...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFE2D1', '#FFF5F0', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Select eSIM Plan</Text>
                    {phone_number && <Text style={styles.headerSubtitle}>For {phone_number}</Text>}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {plans.map((plan) => (
                    <View key={plan.id} style={styles.planCard}>
                        <View style={styles.planHeader}>
                            <View style={styles.iconContainer}>
                                <Text style={{ fontSize: 20 }}>🌍</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <Text style={styles.planRegion}>{plan.region || 'Global'}</Text>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceText}>${plan.price}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.featureRow}>
                            <View style={styles.featureItem}>
                                <MaterialCommunityIcons name="database-outline" size={18} color="#666" />
                                <Text style={styles.featureText}>{plan.data}</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
                                <Text style={styles.featureText}>{plan.duration || '30 Days'}</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialCommunityIcons name="signal" size={18} color="#00C853" />
                                <Text style={[styles.featureText, { color: '#00C853' }]}>5G / 4G</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => handlePurchase(plan)}
                            disabled={purchasing}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF9F65', '#FF3F85']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.buyButton}
                            >
                                <Text style={styles.buyButtonText}>
                                    {purchasing ? 'Processing...' : 'Purchase Plan'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
        fontFamily: FONTS?.medium
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: FONTS?.bold || 'System',
        color: '#1a1a1a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    planCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F7F9FB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planName: {
        fontSize: 16,
        fontFamily: FONTS?.bold || 'System',
        color: '#1a1a1a',
    },
    planRegion: {
        fontSize: 14,
        color: '#666',
    },
    priceContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0052FF',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    featureText: {
        fontSize: 13,
        color: '#333',
        fontFamily: FONTS?.medium
    },
    buyButton: {
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#FF3F85',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buyButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: FONTS?.bold || 'System',
        fontWeight: 'bold',
    }
});

export default SelectPlanScreen;
