import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Title, Paragraph, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type IntentSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'IntentSelection'>;

const IntentSelectionScreen = () => {
    const navigation = useNavigation<IntentSelectionNavigationProp>();
    const { colors } = useTheme();

    const handleSelect = (intent: string) => {
        // In a real app, we might store this preference.
        // For now, it just routes to Dashboard.
        // We could pass params to Dashboard to pre-filter, but MVP req says "navigates to Dashboard"
        navigation.replace('Dashboard');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Title style={styles.title}>Where will you use AIRSWITCH?</Title>
                <Paragraph style={styles.subtitle}>Select your primary usage to help us tailor your experience.</Paragraph>
            </View>

            <Card style={styles.card} onPress={() => handleSelect('Nigeria')}>
                <Card.Content style={styles.cardContent}>
                    <Text style={styles.icon}>🇳🇬</Text>
                    <View style={styles.textContainer}>
                        <Title>Nigeria</Title>
                        <Paragraph>Auto-switch across MTN, Airtel, Glo, & 9mobile.</Paragraph>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => handleSelect('Global')}>
                <Card.Content style={styles.cardContent}>
                    <Text style={styles.icon}>🌍</Text>
                    <View style={styles.textContainer}>
                        <Title>Global / Travel</Title>
                        <Paragraph>Affordable local rates in 150+ countries.</Paragraph>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => handleSelect('Both')}>
                <Card.Content style={styles.cardContent}>
                    <Text style={styles.icon}>🚀</Text>
                    <View style={styles.textContainer}>
                        <Title>Both</Title>
                        <Paragraph>Seamless connectivity at home and abroad.</Paragraph>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
    },
    card: {
        marginBottom: 20,
        elevation: 4,
        borderRadius: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    icon: {
        fontSize: 40,
        marginRight: 20,
    },
    textContainer: {
        flex: 1,
    },
});

export default IntentSelectionScreen;
