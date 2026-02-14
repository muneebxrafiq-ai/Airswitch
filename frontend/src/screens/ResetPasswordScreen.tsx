import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { completePasswordReset } = useAuth();

    // Now we get OTP from params
    const { email, otp } = route.params;

    const validatePassword = (pwd: string): boolean => {
        // At least 6 characters with at least one letter and one digit
        const hasLetter = /[a-zA-Z]/.test(pwd);
        const hasDigit = /[0-9]/.test(pwd);
        return pwd.length >= 6 && hasLetter && hasDigit;
    };

    const handleResetPassword = async () => {
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a new password');
            return;
        }

        if (!validatePassword(password)) {
            Alert.alert('Error', 'Password must be at least 6 characters with at least one letter and one digit');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await completePasswordReset(email, otp, password);
            Alert.alert('Success', 'Password has been reset successfully');
            navigation.navigate('Login');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Set New Password</Title>
            <Text style={styles.subtitle}>
                Enter your new password for {email}
            </Text>

            <TextInput
                label="New Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                autoComplete="new-password"
            />

            <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                autoComplete="new-password"
            />

            <Text style={styles.requirementText}>
                Password must be at least 6 characters with at least one letter and one digit
            </Text>

            <Button
                mode="contained"
                onPress={handleResetPassword}
                style={styles.resetButton}
                loading={isLoading}
                disabled={isLoading}
            >
                Reset Password
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
    },
    input: {
        marginBottom: 16,
    },
    requirementText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    resetButton: {
        paddingVertical: 8,
        marginBottom: 16,
    },
    backButton: {
        marginTop: 20,
    },
});

export default ResetPasswordScreen;
