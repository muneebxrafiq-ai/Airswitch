import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../theme';

const ProfileSettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { user, signOut } = useAuth();

    const initial = user?.name?.[0] || 'T';

    const menuItems = [
        { id: 'history', label: 'History', icon: 'time-outline' as const },
        { id: 'personal', label: 'Personal Information', icon: 'person-outline' as const },
        { id: 'payment', label: 'Payment Method', icon: 'card-outline' as const },
        { id: 'setting', label: 'Setting', icon: 'settings-outline' as const },
        { id: 'help', label: 'Help Center', icon: 'help-circle-outline' as const },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, COLORS.background, COLORS.background]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.profileInfoContainer}>
                        <View style={styles.avatarContainer}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialCommunityIcons name="account" size={50} color={COLORS.textSecondary} />
                                </View>
                            )}
                        </View>

                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{user?.name || 'Emmanuel A.'}</Text>
                            <TouchableOpacity style={styles.editBtn}>
                                <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userEmail}>{user?.email || 'xyz123@gmail.com'}</Text>

                        <View style={styles.locationRow}>
                            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.userLocation}>London, United Kingdom</Text>
                        </View>
                    </View>

                    <View style={styles.menuContainer}>
                        {menuItems.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.8}>
                                <View style={styles.menuItemLeft}>
                                    <Ionicons name={item.icon} size={20} color={COLORS.text} style={styles.menuIcon} />
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={[styles.menuItem, { marginTop: 20 }]} activeOpacity={0.8} onPress={signOut}>
                            <View style={styles.menuItemLeft}>
                                <MaterialCommunityIcons name="logout" size={20} color={COLORS.text} style={styles.menuIcon} />
                                <Text style={styles.menuLabel}>Logout</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

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
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileInfoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: COLORS.surface,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginRight: 8,
    },
    editBtn: {
        padding: 4,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userLocation: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        marginLeft: 4,
    },
    menuContainer: {
        paddingHorizontal: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surfaceLight,
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 30, // Matching the pill-shape in the mockup
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        marginRight: 15,
    },
    menuLabel: {
        fontSize: 15,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
});

export default ProfileSettingsScreen;
