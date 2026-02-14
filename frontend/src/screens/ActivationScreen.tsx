import React, { useState } from 'react';
import { View, StyleSheet, Linking, Alert, ScrollView, TouchableOpacity, Clipboard } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as telnyxService from '../services/telnyx';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS, COLORS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Activation'>;

const ActivationScreen = ({ navigation, route }: Props) => {
    const { orderId, activationUrl, activationCode, smdpAddress } = route.params;
    const [loading, setLoading] = useState(false);

    const handleOpenUrl = () => {
        if (activationUrl) {
            Linking.openURL(activationUrl);
        } else {
            Alert.alert('Info', 'No activation URL available for this plan.');
        }
    };

    const copyText = (text: string, label: string) => {
        if (text) {
            Clipboard.setString(text);
            Alert.alert('Copied', `${label} copied to clipboard`);
        }
    };

    const handleConfirmActivation = async () => {
        setLoading(true);
        try {
            await telnyxService.activateESim(orderId);
            navigation.navigate('SuccessScreen', {
                message: 'Your eSIM has been activated successfully! You can now see it in your dashboard.'
            });
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message || 'Could not confirm activation';
            Alert.alert('Activation Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = (number: number, title: string, description: string, icon: any, onPress?: () => void) => (
        <TouchableOpacity style={styles.stepCard} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
            <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>{number}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepDescription}>{description}</Text>
            </View>
            {onPress && <Ionicons name="chevron-forward" size={20} color="#999" />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFE2D1', '#FFF5F0', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activate eSIM</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusContainer}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="sim" size={40} color="#0052FF" />
                    </View>
                    <Text style={styles.mainTitle}>Setup your eSIM</Text>
                    <Text style={styles.mainSubtitle}>Follow these steps to get connected</Text>
                </View>

                {/* Manual Activation Details */}
                {(activationCode || smdpAddress) && (
                    <View style={styles.manualContainer}>
                        <Text style={styles.sectionTitle}>Manual Installation</Text>
                        <Text style={styles.sectionSubtitle}>
                            Go to Settings {'>'} Cellular {'>'} Add eSIM {'>'} Enter Details Manually
                        </Text>

                        {smdpAddress && (
                            <View style={styles.codeCard}>
                                <Text style={styles.codeLabel}>SM-DP+ ADDRESS</Text>
                                <TouchableOpacity style={styles.codeBox} onPress={() => copyText(smdpAddress, 'SM-DP+ Address')}>
                                    <Text style={styles.codeText} numberOfLines={1}>{smdpAddress}</Text>
                                    <View style={styles.copyBtn}>
                                        <Ionicons name="copy-outline" size={18} color="#0052FF" />
                                        <Text style={styles.copyText}>Copy</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {activationCode && (
                            <View style={styles.codeCard}>
                                <Text style={styles.codeLabel}>ACTIVATION CODE</Text>
                                <TouchableOpacity style={styles.codeBox} onPress={() => copyText(activationCode, 'Activation Code')}>
                                    <Text style={styles.codeText} numberOfLines={1}>{activationCode}</Text>
                                    <View style={styles.copyBtn}>
                                        <Ionicons name="copy-outline" size={18} color="#0052FF" />
                                        <Text style={styles.copyText}>Copy</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.stepsContainer}>
                    <Text style={styles.sectionTitle}>Quick Setup</Text>

                    {renderStep(1, "Open Activation Link", "Follow instructions on provider portal", "open-outline", handleOpenUrl)}
                    {renderStep(2, "Install eSIM", "Follow system prompts to download profile", "download-outline")}
                    {renderStep(3, "Confirm Activation", "Come back here once installed", "checkbox-outline")}

                </View>

                <View style={styles.spacer} />

                <TouchableOpacity
                    onPress={handleConfirmActivation}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#00C853', '#009624']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.confirmButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.confirmButtonText}>I Have Installed It</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Dashboard')}
                    disabled={loading}
                >
                    <Text style={styles.secondaryButtonText}>I'll do this later</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 20,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 4,
        borderColor: 'white',
        shadowColor: '#0052FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    mainTitle: {
        fontSize: 24,
        fontFamily: FONTS?.bold || 'System',
        color: '#1a1a1a',
        marginBottom: 5,
    },
    mainSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    codeCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    codeLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    codeBox: {
        flexDirection: 'row',
        backgroundColor: '#F7F9FB',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    codeText: {
        fontSize: 16,
        fontFamily: 'monospace', // Ensure monospaced font works
        fontWeight: 'bold',
        color: '#333',
    },
    codeHelper: {
        fontSize: 12,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
    },
    stepsContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 15,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    stepNumberContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#0052FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumber: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    stepDescription: {
        fontSize: 13,
        color: '#666',
    },
    spacer: {
        flex: 1,
    },
    confirmButton: {
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 15,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '500',
    },
    manualContainer: {
        marginBottom: 20,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 15,
        marginTop: -10,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    copyText: {
        fontSize: 12,
        color: '#0052FF',
        fontWeight: 'bold',
        marginLeft: 4,
    }
});

export default ActivationScreen;
