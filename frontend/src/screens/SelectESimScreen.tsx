
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ESim } from '../navigation/types';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

// Define the navigation and route props
type SelectESimScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SelectESim'>;
type SelectESimScreenRouteProp = RouteProp<RootStackParamList, 'SelectESim'>;

const SelectESimScreen = () => {
    const navigation = useNavigation<SelectESimScreenNavigationProp>();
    const route = useRoute<SelectESimScreenRouteProp>();
    const { colors } = useTheme();
    const [esims, setEsims] = useState<ESim[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Get the callback from params
    const onSelect = route.params?.onSelect;

    const fetchEsims = async () => {
        try {
            const response = await api.get('/esim/my-esims');
            setEsims(response.data);
        } catch (error: any) {
            console.error('Fetch eSIMs Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEsims();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEsims();
    };

    const handleSelect = (item: ESim) => {
        if (onSelect) {
            onSelect(item);
            navigation.goBack();
        } else {
            // Fallback if no callback provided, maybe just go back or show details
            console.warn("No selection callback provided");
            navigation.goBack();
        }
    };

    // Filter only ACTIVE eSIMs for selection typically, unless specified otherwise
    const activeEsims = esims.filter(e => e.status === 'ACTIVE');

    const renderItem = ({ item }: { item: ESim }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                    <Text style={{ fontSize: 24 }}>🇺🇸</Text>
                    {/* Note: Flag mapping logic needs to be robust, using generic for now */}
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.cardCountry}>{item.region || 'Unknown Region'}</Text>
                    <Text style={styles.cardPlanName}>{item.planName || 'Standard Plan'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardStatsRow}>
                <Text style={styles.dataLabel}>ICCMD</Text>
                <Text style={styles.dataValue}>{item.iccid.substring(0, 8)}...</Text>
            </View>

            <View style={styles.cardActionRow}>
                <Text style={styles.validityText}>Tap to select</Text>
                <LinearGradient
                    colors={['#0052FF', '#00D4FF']} // Different gradient for "Action" vs "Manage"
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.selectBtn}
                >
                    <Text style={styles.selectBtnText}>Select</Text>
                </LinearGradient>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFE2D1', '#FFF5F0', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select eSIM</Text>
                <Text style={styles.headerSubtitle}>Choose an eSIM to continue</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
            ) : (
                <FlatList
                    data={activeEsims}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No active eSIMs found.</Text>
                            <Button mode="contained" onPress={() => navigation.navigate('SelectPlan' as any)} style={{ marginTop: 20 }}>
                                Buy a New Plan
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
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    listContent: {
        padding: 15,
        paddingBottom: 50,
    },
    card: {
        marginBottom: 15,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#F7F9FB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardCountry: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    cardPlanName: {
        fontSize: 13,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    dataLabel: {
        fontSize: 13,
        color: '#666',
    },
    dataValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    cardActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    validityText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    selectBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 15,
    },
    selectBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
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

export default SelectESimScreen;
