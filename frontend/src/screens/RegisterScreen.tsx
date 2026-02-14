import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button, Text, Title, useTheme, IconButton } from 'react-native-paper'; // IconButton for eye
import { useAuth } from '../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SPACING, FONTS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Simple Error State
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const { initiateSignUp } = useAuth();

    const handleRegister = async () => {
        // Reset Errors
        setEmailError('');
        setPasswordError('');

        // Basic Validation
        if (!email.includes('@')) {
            setEmailError('Invalid email address');
            return;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            // Send empty name as placeholder. Will be filled in ProfileCreation.
            await initiateSignUp(email, password, "");
            navigation.navigate('OTP', { email, type: 'register' });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Registration Failed. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logoText}>Logo</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Title style={styles.title}>Create an Account</Title>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
                </View>

                <Text style={styles.subtitle}>
                    Enter your username, email & password. If you forget it, then you have to do forgot password.
                </Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        placeholder="Enter email"
                        error={!!emailError}
                    />

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            style={[styles.input, { flex: 1 }]}
                            mode="flat"
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                            placeholder="Enter password"
                            secureTextEntry={!showPassword}
                            error={!!passwordError}
                            right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)} />}
                        />
                    </View>

                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={[styles.input, { flex: 1 }]}
                            mode="flat"
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                            placeholder="Confirm password"
                            secureTextEntry={!showPassword}
                            right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)} />}
                        />
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>

                {/* Social Login */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                    <TouchableOpacity style={styles.socialBtn}>
                        <MaterialCommunityIcons name="google" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn}>
                        <MaterialCommunityIcons name="apple" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn}>
                        <MaterialCommunityIcons name="facebook" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleRegister} style={styles.signupButton}>
                        {isLoading ? (
                            <Text style={styles.signupButtonText}>Loading...</Text>
                        ) : (
                            <Text style={styles.signupButtonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Have an account? Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        alignItems: 'center',
        paddingTop: SPACING.l,
    },
    logoText: {
        fontSize: 24,
        color: COLORS.textSecondary,
        opacity: 0.5,
    },
    content: {
        padding: SPACING.l,
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    form: {
        marginBottom: SPACING.l,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        height: 40,
        paddingHorizontal: 0,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: SPACING.m,
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: SPACING.xl,
    },
    socialBtn: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    signupButton: {
        // Based on wireframe "Sign Up" text is large at bottom? 
        // Or is it a button? Screenshot 1 shows "Sign Up" as large text label.
        // I'll make it a text-button or clear button style.
        marginBottom: SPACING.m,
    },
    signupButtonText: {
        fontSize: 24,
        color: COLORS.textSecondary, // Grey
        fontWeight: '500',
    },
    loginLink: {
        color: COLORS.textSecondary,
        fontSize: 12,
        opacity: 0.7,
    }
});

export default RegisterScreen;
