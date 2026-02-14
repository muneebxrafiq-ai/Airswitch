import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: { navigation: LoginScreenNavigationProp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });
    const { signIn } = useAuth();
    const passwordInputRef = useRef<any>(null);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: '', password: '' };

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        Keyboard.dismiss();
        setIsLoading(true);

        try {
            await signIn(email, password);
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to login. Please try again.';
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitEditing = () => {
        if (email && password) {
            handleLogin();
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <Title style={styles.title}>Welcome Back 👋</Title>
                    <Text style={styles.subtitle}>Sign in to continue</Text>

                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        style={styles.input}
                        mode="outlined"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                        onSubmitEditing={() => {
                            passwordInputRef.current?.focus();
                        }}
                        blurOnSubmit={false}
                        error={!!errors.email}
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                    <TextInput
                        ref={passwordInputRef}
                        label="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        style={styles.input}
                        mode="outlined"
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleSubmitEditing}
                        error={!!errors.password}
                    />
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        style={styles.button}
                        loading={isLoading}
                        disabled={isLoading}
                        icon={isLoading ? () => <ActivityIndicator color="#fff" size="small" /> : undefined}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Button
                            mode="text"
                            onPress={() => navigation.navigate('Register')}
                            labelStyle={styles.linkText}
                            compact
                        >
                            Sign Up
                        </Button>
                    </View>

                    <View style={styles.forgotPasswordContainer}>
                        <Button
                            mode="text"
                            onPress={() => navigation.navigate('ForgotPassword')}
                            labelStyle={styles.forgotPasswordText}
                            compact
                        >
                            Forgot Password?
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
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
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 16,
        paddingVertical: 8,
        borderRadius: 8,
        height: 48,
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#666',
    },
    linkText: {
        marginLeft: 4,
    },
    errorText: {
        color: '#B00020',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
    },
    forgotPasswordContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    forgotPasswordText: {
        color: '#6200ee',
        fontSize: 14,
    },
});

export default LoginScreen;
