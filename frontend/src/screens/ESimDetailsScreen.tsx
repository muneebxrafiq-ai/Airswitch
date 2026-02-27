import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, useWindowDimensions } from 'react-native';
import { Text, Title, Paragraph, Button, Divider, ActivityIndicator, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

type ESimDetailsRouteProp = RouteProp<RootStackParamList, 'ESimDetails'>;

const ESimDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<ESimDetailsRouteProp>();
    const { esim, usage: initialUsage } = route.params;
    const { colors } = useTheme();
    const { width } = useWindowDimensions();

    const [loading, setLoading] = useState(false);
    // Local state to reflect status changes immediately
    const [status, setStatus] = useState(esim.status);
    const [usage, setUsage] = useState<any>(initialUsage || null);
    const [usageLoading, setUsageLoading] = useState(false);

    useEffect(() => {
        if (!usage && status === 'ACTIVE') {
            fetchUsage();
        }
    }, []);

    const fetchUsage = async () => {
        try {
            setUsageLoading(true);
            const response = await api.get(`/esim/${esim.id}/usage`);
            setUsage(response.data);
        } catch (error) {
            console.error('Failed to fetch usage', error);
        } finally {
            setUsageLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        // ToastAndroid.show('Copied!', ToastAndroid.SHORT); // Or use a snackbar
        Alert.alert('Copied', 'Text copied to clipboard');
    };

    const handleDeactivate = () => {
        Alert.alert(
            'Deactivate eSIM',
            'Are you sure you want to deactivate this eSIM? This action cannot be undone and you will lose connectivity.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: confirmDeactivate
                }
            ]
        );
    };

    const confirmDeactivate = async () => {
        setLoading(true);
        try {
            await api.post('/esim/deactivate', { esimId: esim.id });
            setStatus('INACTIVE');
            Alert.alert('Success', 'eSIM has been deactivated.');
            // navigation.goBack(); // Optional: Go back or stay here showing inactive
        } catch (error: any) {
            console.error('Deactivate Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to deactivate eSIM');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'ACTIVE': return '#4CAF50';
            case 'INACTIVE': return '#9E9E9E';
            case 'EXPIRED': return '#F44336';
            default: return '#2196F3';
        }
    };

    // Usage stats
    const used = usage ? parseFloat(usage.used) : 0;
    const total = usage ? parseFloat(usage.total) : 1000;
    const unit = usage ? usage.unit : 'MB';
    const percent = usage ? (used / total) : 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>eSIM Details</Text>
            </View>

            <View style={styles.statusBanner}>
                {/* <MaterialCommunityIcons name="circle" size={16} color={getStatusColor(status)} /> */}
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
            </View>

            {status === 'ACTIVE' && (
                <View style={styles.card}>
                    <Title style={styles.sectionTitle}>Data Usage</Title>
                    {usageLoading ? (
                        <ActivityIndicator />
                    ) : (
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                <Text style={styles.label}>Used</Text>
                                <Text style={[styles.value, { textAlign: 'right' }]}>
                                    {used.toFixed(2)} {unit} <Text style={{ color: '#999' }}>/ {total} {unit}</Text>
                                </Text>
                            </View>
                            {/* Progress Bar Background */}
                            <View style={{ height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                                {/* Progress Bar Fill */}
                                <LinearGradient
                                    colors={['#FF9F65', '#FF3F85']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{ width: `${Math.min(percent * 100, 100)}%`, height: '100%' }}
                                />
                            </View>
                            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                                {Math.round((1 - percent) * 100)}% data remaining
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.card}>
                <Title style={styles.sectionTitle}>Plan Information</Title>
                <View style={styles.row}>
                    <Text style={styles.label}>Plan Name:</Text>
                    <Text style={styles.value}>{esim.planName || 'Unknown Plan'}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.label}>Region:</Text>
                    <Text style={styles.value}>{esim.region || 'Global'}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.label}>ICCID:</Text>
                    <Text style={styles.value}>{esim.iccid}</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(esim.iccid)}>
                        <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.card}>
                <Title style={styles.sectionTitle}>Installation</Title>
                {esim.qrCodeUrl ? (
                    <View style={styles.qrContainer}>
                        <Image
                            source={{ uri: esim.qrCodeUrl }}
                            style={{ width: 200, height: 200, resizeMode: 'contain' }}
                        />
                        <Paragraph style={styles.qrHint}>Scan this QR code in your device settings to install.</Paragraph>
                    </View>
                ) : (
                    <Paragraph>No QR Code available.</Paragraph>
                )}

                {esim.smdpAddress && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={styles.label}>SM-DP+ Address:</Text>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText} selectable>{esim.smdpAddress}</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(esim.smdpAddress!)}>
                                <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {esim.activationCode && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={styles.label}>Activation Code:</Text>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText} selectable>{esim.activationCode}</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(esim.activationCode!)}>
                                <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {status === 'ACTIVE' && (
                <Button
                    mode="contained"
                    color="#FF5252"
                    onPress={handleDeactivate}
                    loading={loading}
                    disabled={loading}
                    style={styles.deactivateButton}
                    icon="delete"
                >
                    Deactivate eSIM
                </Button>
            )}

            <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                Close
            </Button>
        </ScrollView>
    );
};

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'white',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginTop: 15,
        padding: 20,
        borderRadius: 12,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 15,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    label: {
        color: '#666',
        fontSize: 14,
    },
    value: {
        fontWeight: '500',
        color: '#333',
        fontSize: 14,
        flex: 1,
        textAlign: 'right',
    },
    divider: {
        backgroundColor: '#eee',
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    qrHint: {
        textAlign: 'center',
        marginTop: 10,
        color: '#666',
        fontSize: 12,
    },
    codeBox: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginTop: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#eee',
    },
    codeText: {
        fontSize: 12,
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    deactivateButton: {
        marginHorizontal: 15,
        marginTop: 30,
        backgroundColor: '#FF5252',
    }
});

export default ESimDetailsScreen;
