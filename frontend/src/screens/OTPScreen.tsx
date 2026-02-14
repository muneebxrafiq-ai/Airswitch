import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { initiateRegister, forgotPassword } from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

const OTPScreen = ({ navigation, route }: Props) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [hasRequestedResend, setHasRequestedResend] = useState(false);
    const inputRefs = useRef<(any)[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { completeSignUp } = useAuth();

    // name and password are no longer needed here for register, as they are stored in DB temporarily (RegistrationAttempt)
    const { email, type, password, name } = route.params;

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Countdown timer for resend button
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, [resendTimer]);

    const handleOTPChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            Alert.alert('Error', 'Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        try {
            if (type === 'register') {
                // Complete registration
                await completeSignUp(email, otpString);
                // Navigation handles automatically via AuthContext

            } else if (type === 'reset') {
                // For password reset, navigate to reset password screen AND PASS THE OTP
                navigation.navigate('ResetPassword', { email, otp: otpString });
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Verification Failed';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) {
            Alert.alert('Please Wait', `You can resend code in ${resendTimer} seconds`);
            return;
        }

        setResendLoading(true);
        try {
            if (type === 'register') {
                // Resend OTP for registration
                await initiateRegister(email, password!, name!);
                Alert.alert('Success', 'OTP has been resent to your email');
                setResendTimer(60); // 60 second cooldown
                setHasRequestedResend(true);
            } else if (type === 'reset') {
                // Resend OTP for password reset
                await forgotPassword(email);
                Alert.alert('Success', 'OTP has been resent to your email');
                setResendTimer(60); // 60 second cooldown
                setHasRequestedResend(true);
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to resend OTP';
            Alert.alert('Error', msg);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Verify Your Email</Title>
            <Text style={styles.subtitle}>
                We've sent a verification code to {email}
            </Text>

            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref: any) => (inputRefs.current[index] = ref)}
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(value) => handleOTPChange(value.replace(/[^0-9]/g, ''), index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        mode="outlined"
                        textAlign="center"
                    />
                ))}
            </View>

            <Button
                mode="contained"
                onPress={handleVerifyOTP}
                style={styles.verifyButton}
                loading={isLoading}
                disabled={isLoading}
            >
                Verify Code
            </Button>

            <View style={styles.resendContainer}>
                <Button
                    mode="outlined"
                    onPress={handleResendOTP}
                    style={styles.resendButton}
                    loading={resendLoading}
                    disabled={resendLoading || resendTimer > 0}
                >
                    {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                </Button>
                {resendTimer > 0 && (
                    <Text style={styles.timerText}>
                        You can resend the code again in {resendTimer} seconds
                    </Text>
                )}
            </View>

            <Button
                mode="text"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                Back
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
        marginBottom: 40,
        textAlign: 'center',
        color: '#666',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpInput: {
        width: 45,
        height: 55,
        fontSize: 20,
        textAlign: 'center',
    },
    verifyButton: {
        paddingVertical: 8,
        marginBottom: 16,
    },
    resendContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    resendButton: {
        width: '100%',
        marginBottom: 8,
    },
    timerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
    },
});

export default OTPScreen;
