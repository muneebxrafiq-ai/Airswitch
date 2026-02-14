import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { requestPasswordReset } = useAuth();

    const handleSendOTP = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            Alert.alert('Success', 'Password reset code has been sent to your email');
            navigation.navigate('OTP', { email, type: 'reset' });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Reset Password</Title>
            <Text style={styles.subtitle}>
                Enter your email address and we'll send you a code to reset your password
            </Text>

            <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
            />

            <Button
                mode="contained"
                onPress={handleSendOTP}
                style={styles.sendButton}
                loading={isLoading}
                disabled={isLoading}
            >
                Send Reset Code
            </Button>

            <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
            >
                Back to Login
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#6200ee',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
    },
    input: {
        marginBottom: 24,
    },
    sendButton: {
        paddingVertical: 8,
        marginBottom: 16,
    },
    backButton: {
        marginTop: 20,
    },
});

export default ForgotPasswordScreen;
