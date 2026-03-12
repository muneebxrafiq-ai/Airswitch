import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Avatar } from 'react-native-paper';
import { FONTS, COLORS } from '../theme';

// Mock data based on user request
const POPULAR_COUNTRIES = [
    { id: '1', name: 'Nigeria', flag: require('../../assets/flags/nigeria.jpg'), plans: '15 Plans' },
    { id: '2', name: 'UK', flag: require('../../assets/flags/uk.jpg'), plans: '12 Plans' },
    { id: '3', name: 'Pakistan', flag: require('../../assets/flags/pakistan.jpg'), plans: '18 Plans' },
    { id: '4', name: 'USA', flag: require('../../assets/flags/uk.jpg'), plans: '15 Plans' },
];

const ALL_PLANS = [
    { id: '1', country: 'United States', code: 'US', data: '10GB', duration: '30 Days', price: 30, network: '5G/LTE • Ultra Fast', popular: true },
    { id: '2', country: 'Global', code: 'GL', data: '5GB', duration: '30 Days', price: 25, network: '4G/LTE • Reliable', popular: true },
    { id: '3', country: 'Europe', code: 'EU', data: '3GB', duration: '15 Days', price: 15, network: '5G/LTE • Ultra Fast', popular: false },
    { id: '4', country: 'Nigeria', code: 'NG', data: '2GB', duration: '7 Days', price: 8, network: '4G/LTE', popular: false },
    { id: '5', country: 'Pakistan', code: 'PK', data: '5GB', duration: '30 Days', price: 12, network: '4G/LTE', popular: true },
];

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const renderCountryItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.countryCard} onPress={() => navigation.navigate('SelectPlan', { country: item.name })} activeOpacity={0.8}>
            <View style={styles.flagContainer}>
                <Image source={item.flag} style={styles.flagImage} resizeMode="cover" />
            </View>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.planCount}>{item.plans}</Text>
        </TouchableOpacity>
    );



    const filteredCountries = POPULAR_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPlans = ALL_PLANS.filter(p =>
        p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, COLORS.background, COLORS.background]} // Updated to dark background
                style={styles.gradientBackground}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Global eSIM</Text>
                            <Text style={styles.headerSubtitle}>Connect anywhere, instantly</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ fontSize: 16 }}>{user?.name?.[0] || 'U'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by country"
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Popular Countries */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Countries</Text>
                    </View>
                    <FlatList
                        horizontal
                        data={filteredCountries}
                        renderItem={renderCountryItem}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.countriesList}
                        ListEmptyComponent={<Text style={{ marginLeft: 20, color: '#999' }}>No countries found</Text>}
                    />

                    {/* All Plans */}
                    <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                        <Text style={styles.sectionTitle}>All Plans</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SelectPlan')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredPlans.map(plan => (
                        <View key={plan.id} style={{ marginBottom: 15 }}>
                            {/* Re-implementing logic because FlatList inside ScrollView is bad, mapping here */}
                            {/* Wait, the renderPlanItem logic needs to be adapted for map */}
                            <View style={styles.planCard}>
                                <View style={styles.planHeaderRow}>
                                    {plan.popular ? (
                                        <LinearGradient
                                            colors={['#8E2DE2', '#4A00E0']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.popularTag}
                                        >
                                            <MaterialCommunityIcons name="fire" size={14} color="white" style={{ marginRight: 4 }} />
                                            <Text style={styles.popularText}>Popular</Text>
                                        </LinearGradient>
                                    ) : <View />}
                                    <Text style={styles.planPrice}>${plan.price}</Text>
                                </View>

                                <View style={styles.planContentRow}>
                                    <View style={styles.countryCodeContainer}>
                                        <Text style={styles.countryCode}>{plan.code}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={styles.planCountryName}>{plan.country}</Text>
                                        <Text style={styles.planNetwork}>{plan.network}</Text>
                                        <Text style={styles.planData}>{plan.data} / {plan.duration}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Checkout', {
                                        plan: {
                                            iccid: 'mock_iccid_' + plan.id,
                                            region: plan.country,
                                            dataLimit: plan.data,
                                            price: plan.price
                                        }
                                    })}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF9F65', '#FF3F85']} // Vibrant Orange to Pink
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={styles.viewDetailsButton}
                                    >
                                        <Text style={styles.viewDetailsText}>View Details</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: FONTS.extraBold,
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginTop: 4,
        fontFamily: FONTS.medium,
    },
    profileImage: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 10,
        color: COLORS.textSecondary,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    viewAllText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
    },
    countriesList: {
        paddingRight: 20,
    },
    countryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24, // Softer curves
        paddingVertical: 20,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginRight: 15,
        width: 120, // Slightly wider
        height: 160, // Taller
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    flagContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    flagImage: {
        width: 60,
        height: 60,
        borderRadius: 30, // Ensures circular clipping
        borderWidth: 0,
    },
    countryName: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        marginBottom: 4,
    },
    planCount: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
    // Updated Plan Card Styles
    planCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 15,
    },
    planHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    popularTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    popularText: {
        color: 'white',
        fontSize: 12,
        fontFamily: FONTS.bold,
    },
    planPrice: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    planContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    countryCodeContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    countryCode: {
        fontSize: 18,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    planCountryName: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    planNetwork: {
        fontSize: 13,
        color: COLORS.success, // Greenish
        fontFamily: FONTS.medium,
        marginBottom: 2,
    },
    planData: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
    viewDetailsButton: {
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF3F85',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    viewDetailsText: {
        color: 'white',
        fontSize: 16,
        fontFamily: FONTS.bold,
    },
});

export default HomeScreen;
