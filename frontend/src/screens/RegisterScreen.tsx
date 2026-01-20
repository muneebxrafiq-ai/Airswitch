import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signUp } = useAuth();
    const theme = useTheme();

    const handleRegister = async () => {
        try {
            await signUp(email, password, name);
            // Navigation is handled by AuthContext state change or manually if needed
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Please check your input and try again.';
            Alert.alert('Registration Failed', errorMessage);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Join Airswitch 🚀</Title>
            <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
            />
            <Button mode="contained" onPress={handleRegister} style={styles.button}>
                Create Account
            </Button>
            <Button onPress={() => navigation.navigate('Login')} style={styles.link}>
                Already have an account? Login
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
        marginBottom: 24,
        textAlign: 'center',
        color: '#6200ee',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
    link: {
        marginTop: 16,
    },
});

export default RegisterScreen;
