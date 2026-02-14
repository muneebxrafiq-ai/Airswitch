import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Title, Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SPACING, FONTS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'SuccessScreen'>;

const { width } = Dimensions.get('window');

const SuccessScreen = ({ navigation, route }: Props) => {
    const { message } = route.params;

    useEffect(() => {
        // Auto-redirect after 3 seconds
        const timer = setTimeout(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: 'IntentSelection' }], // Go to Intent or Dashboard
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            {/* Background is grey/dimmed as per design */}

            <View style={styles.card}>
                {/* Icon Cluster or Large Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="account" size={40} color={COLORS.white} />
                    </View>
                    {/* Decorative dots could be added here if needed using absolute positioning */}
                </View>

                <Title style={styles.title}>Profile Created</Title>
                <Text style={styles.message}>
                    {message || 'Your account has been created. Please wait a moment, we are preparing for you...'}
                </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('IntentSelection')} style={styles.continueButton}>
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent dark background
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        width: width * 0.85,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: SPACING.l,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.textSecondary, // Grey circle
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#E5E7EB', // Lighter ring
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SPACING.m,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: SPACING.s,
    },
    continueButton: {
        position: 'absolute',
        bottom: 50,
    },
    continueText: {
        fontSize: 18,
        color: COLORS.white,
        fontWeight: '500',
    }
});

export default SuccessScreen;
