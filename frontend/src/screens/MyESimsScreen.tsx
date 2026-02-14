import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Card, Title, Paragraph, Chip, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ESim } from '../navigation/types';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type MyESimsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyESims'>;

const MyESimsScreen = () => {
    const navigation = useNavigation<MyESimsScreenNavigationProp>();
    const { colors } = useTheme();
    const [esims, setEsims] = useState<ESim[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const fetchEsims = async () => {
        try {
            const response = await api.get('/esim/my-esims');
            setEsims(response.data);
            await AsyncStorage.setItem('cached_esims', JSON.stringify(response.data));
        } catch (error: any) {
            console.error('Fetch eSIMs Error:', error);
            // Alert.alert('Error', 'Failed to fetch your eSIMs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadCachedData = async () => {
        try {
            const cached = await AsyncStorage.getItem('cached_esims');
            if (cached) {
                setEsims(JSON.parse(cached));
                setLoading(false); // Show cached data immediately
            }
        } catch (e) {
            console.log('Failed to load cache');
        }
    };

    useEffect(() => {
        loadCachedData();
        fetchEsims();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEsims();
    };

    const filteredEsims = Array.isArray(esims) ? esims.filter(e => {
        if (filter === 'ACTIVE') return e.status === 'ACTIVE';
        return e.status !== 'ACTIVE';
    }) : [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return '#4CAF50';
            case 'INACTIVE': return '#9E9E9E';
            case 'EXPIRED': return '#F44336';
            default: return '#2196F3';
        }
    };

    const renderItem = ({ item }: { item: ESim }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                    <Text style={{ fontSize: 24 }}>🇺🇸</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.cardCountry}>{item.region || 'United States'}</Text>
                    <Text style={styles.cardPlanName}>{item.planName || 'USA Premium 5G'}</Text>
                </View>
                <LinearGradient
                    colors={['#8E2DE2', '#4A00E0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.smallBadge}
                >
                    <Text style={styles.badgeText}>Popular</Text>
                </LinearGradient>
            </View>

            <View style={styles.cardStatsRow}>
                <Text style={styles.dataLabel}>Data Usage</Text>
                <Text style={styles.dataValue}>2.3GB<Text style={{ color: '#999', fontWeight: 'normal' }}>/10GB</Text></Text>
            </View>

            <View style={styles.cardNetworkRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Network</Text>
                    <Text style={styles.statValue}>5G</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Speed</Text>
                    <Text style={styles.statValue}>Ultra Fast</Text>
                </View>
            </View>

            <View style={styles.cardActionRow}>
                <Text style={styles.validityText}>Valid until Oct 30, 2025</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ESimDetails', { esim: item })} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#FF9F65', '#FF3F85']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.manageBtn}
                    >
                        <Text style={styles.manageBtnText}>Manage</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFE2D1', '#FFF5F0', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My eSIMs</Text>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => setFilter('ACTIVE')} activeOpacity={0.8}>
                    {filter === 'ACTIVE' ? (
                        <LinearGradient
                            colors={['#FF9F65', '#FF3F85']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.activeTab}
                        >
                            <Text style={styles.activeTabText}>Active Plans</Text>
                        </LinearGradient>
                    ) : (
                        <View style={styles.inactiveTab}>
                            <Text style={styles.inactiveTabText}>Active Plans</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setFilter('INACTIVE')} activeOpacity={0.8}>
                    {filter === 'INACTIVE' ? (
                        <LinearGradient
                            colors={['#FF9F65', '#FF3F85']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.activeTab}
                        >
                            <Text style={styles.activeTabText}>History</Text>
                        </LinearGradient>
                    ) : (
                        <View style={styles.inactiveTab}>
                            <Text style={styles.inactiveTabText}>History</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
            ) : (
                <FlatList
                    data={filteredEsims}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No eSIMs found.</Text>
                            <Button mode="contained" onPress={() => navigation.navigate('SelectPlan', {})} style={{ marginTop: 20 }}>
                                Buy Plans
                            </Button>
                        </View>
                    }
                />
            )}
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
        paddingBottom: 20,
        paddingHorizontal: 20,
        // Transparent header for gradient
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
        justifyContent: 'center',
        gap: 15,
    },
    activeTab: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 4,
        shadowColor: '#FF3F85',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    inactiveTab: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // Transparent white
    },
    activeTabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    inactiveTabText: {
        color: '#888',
        fontWeight: '600',
        fontSize: 16,
    },
    listContent: {
        padding: 15,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F7F9FB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardCountry: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    cardPlanName: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    smallBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dataLabel: {
        fontSize: 14,
        color: '#666',
    },
    dataValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    cardNetworkRow: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 15,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FCFCFC',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    cardActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    validityText: {
        fontSize: 13,
        color: '#666',
    },
    manageBtn: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 20,
        shadowColor: '#FF3F85',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    manageBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Keep empty container styles
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    }
});

export default MyESimsScreen;
