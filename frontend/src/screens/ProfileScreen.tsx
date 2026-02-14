import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Text, Switch, Modal, Portal, Provider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { FONTS, SIZES } from '../theme'; // Added SIZES
import Svg, { Path } from 'react-native-svg'; // Import SVG

const ProfileScreen = () => {
    const { user, signOut, updateUserProfile } = useAuth();
    const navigation = useNavigation<any>();
    const [updating, setUpdating] = React.useState(false);

    // Calculate curve path
    const w = SIZES.width; // Screen width (from theme)
    // We want the card to start slightly lower, and the hump to stick up.
    // Let's say the SVG height is 80.
    // The flat shoulders are at y=40, curve goes up to y=0.
    const h = 80;
    const shoulderY = 40;
    const center = w / 2;
    const humpWidth = 140; // Total width of the curvy part

    // Path:
    // Start Bottom Left (0, h)
    // Line Up to Shoulder (0, shoulderY)
    // Line to start of hump (center - humpWidth/2, shoulderY)
    // Cubic Bezier to Top (center, 0) with control points easing the inflection
    // Symmetric down to (center + humpWidth/2, shoulderY)
    // Line to right edge (w, shoulderY)
    // Line down to (w, h)
    // Close path.

    // Control Points for smooth bell: 
    // CP1: (center - humpWidth/4, shoulderY) -- waits a bit before rising? No, that's convex.
    // To get concave start (fillet), CP1 needs to be horizontal-ish? 
    // Let's try a standard smooth curve.

    const curvePath = `
        M 0,${h}
        L 0,${shoulderY}
        L ${center - humpWidth / 2},${shoulderY}
        C ${center - humpWidth / 4},${shoulderY} ${center - humpWidth / 4},0 ${center},0
        C ${center + humpWidth / 4},0 ${center + humpWidth / 4},${shoulderY} ${center + humpWidth / 2},${shoulderY}
        L ${w},${shoulderY}
        L ${w},${h}
        Z
    `;

    const handleImagePick = async (useCamera: boolean) => {
        try {
            const permissionResult = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "You need to grant permission to access photos.");
                return;
            }

            const result = await (useCamera
                ? ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                })
                : ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                })
            );

            if (!result.canceled && result.assets && result.assets[0].base64) {
                const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setUpdating(true);
                await updateUserProfile(undefined, base64Img);
                Alert.alert("Success", "Profile photo updated!");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to pick image");
        } finally {
            setUpdating(false);
        }
    };

    const handleRemovePhoto = async () => {
        try {
            setUpdating(true);
            await updateUserProfile(undefined, null);
            Alert.alert("Success", "Profile photo removed.");
        } catch (error) {
            Alert.alert("Error", "Failed to remove photo");
        } finally {
            setUpdating(false);
        }
    };

    const showOptions = () => {
        Alert.alert(
            "Update Profile Photo",
            "Choose an option",
            [
                { text: "Camera", onPress: () => handleImagePick(true) },
                { text: "Gallery", onPress: () => handleImagePick(false) },
                { text: "Remove Photo", onPress: handleRemovePhoto, style: "destructive" },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Full Screen Gradient */}
            <LinearGradient
                colors={['#FFE2D1', '#FFF5F0', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header Actions */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Spacer for overlapping look */}
                    <View style={{ height: 60 }} />

                    {/* Main Content Card */}
                    <View style={styles.whiteCardContainer}>
                        {/* SVG Curve Header */}
                        <View style={styles.svgContainer}>
                            <Svg width={SIZES.width} height={80} viewBox={`0 0 ${SIZES.width} 80`}>
                                <Path d={curvePath} fill="white" />
                            </Svg>
                        </View>

                        {/* Main Content Body */}
                        <View style={styles.whiteCardBody}>
                            {/* Overlapping Avatar */}
                            <View style={styles.avatarContainer}>
                                {user?.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                                ) : (
                                    <LinearGradient
                                        colors={['#8E2DE2', '#4A00E0']}
                                        style={styles.avatarPlaceholder}
                                    >
                                        <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                                    </LinearGradient>
                                )}

                                {/* Plus Button */}
                                <TouchableOpacity style={styles.plusBtn} onPress={showOptions} disabled={updating}>
                                    {updating ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.name}>{user?.name || 'John Traveler'}</Text>
                            <Text style={styles.memberSince}>Premium Member since 2024</Text>

                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>124GB</Text>
                                    <Text style={styles.statLabel}>Total Data Used</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>04</Text>
                                    <Text style={styles.statLabel}>Active Plans</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>08</Text>
                                    <Text style={styles.statLabel}>Countries Visited</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>$158</Text>
                                    <Text style={styles.statLabel}>Total Savings</Text>
                                </View>
                            </View>

                            {/* Menu Items */}
                            <View style={styles.menuContainer}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TopUp')} activeOpacity={0.7}>
                                    <View style={[styles.menuIconBox, { backgroundColor: '#FFF0F5' }]}>
                                        <MaterialCommunityIcons name="wallet-outline" size={24} color="#FF3F85" />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuTitle}>Wallet & Billing</Text>
                                        <Text style={styles.menuSubtitle}>Payment Methods & transactions</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#E0E0E0" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                                    <View style={[styles.menuIconBox, { backgroundColor: '#F0F5FF' }]}>
                                        <MaterialCommunityIcons name="bell-outline" size={24} color="#4A00E0" />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuTitle}>Notifications</Text>
                                        <Text style={styles.menuSubtitle}>Manage alerts & updates</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#E0E0E0" />
                                </TouchableOpacity>

                                {/* Help & Support */}
                                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                                    <View style={[styles.menuIconBox, { backgroundColor: '#E0F7FA' }]}>
                                        <MaterialCommunityIcons name="help-circle-outline" size={24} color="#00BCD4" />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuTitle}>Help & Support</Text>
                                        <Text style={styles.menuSubtitle}>FAQs & Customer Service</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#E0E0E0" />
                                </TouchableOpacity>

                                {/* Privacy & Security */}
                                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                                    <View style={[styles.menuIconBox, { backgroundColor: '#E8F5E9' }]}>
                                        <MaterialCommunityIcons name="shield-check-outline" size={24} color="#4CAF50" />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuTitle}>Privacy & Security</Text>
                                        <Text style={styles.menuSubtitle}>Biometrics & Password</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#E0E0E0" />
                                </TouchableOpacity>

                                {/* About App */}
                                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                                    <View style={[styles.menuIconBox, { backgroundColor: '#ECEFF1' }]}>
                                        <MaterialCommunityIcons name="information-outline" size={24} color="#607D8B" />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuTitle}>About App</Text>
                                        <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#E0E0E0" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                                <Text style={styles.logoutText}>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: FONTS.extraBold,
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    iconBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    whiteCardContainer: {
        alignItems: 'center',
        // No background color here, just container
    },
    svgContainer: {
        width: '100%',
        height: 80,
        marginBottom: -1, // Prevent hairline crack
        zIndex: 1, // behind avatar? Avatar is zIndex 10
    },
    whiteCardBody: {
        backgroundColor: 'white',
        width: '100%',
        paddingHorizontal: 25,
        paddingBottom: 100,
        minHeight: 600,
        alignItems: 'center',
        overflow: 'visible', // CRITICAL: Allow avatar to hang out the top
        zIndex: 2,
    },
    curve: {
        display: 'none', // Remove old curve
    },
    avatarContainer: {
        marginTop: -130, // Pull up to center on the SVG peak (Peak at 0. Body at 80. Avatar 100 center -> 50. Margin = 50 - 80 - 100? No. 
        // We want Top of Avatar at -50 relative to Body Start.
        // Body Start is y=80 relative to SVG Top.
        // Avatar starts at y=-50 relative to SVG Top.
        // So Relative to Body Start, Avatar Top is -50 - 80 = -130. Correct.
        marginBottom: 10,
        alignSelf: 'center', // Ensure center alignment
        zIndex: 100, // High zIndex to sit ON TOP of everything
        elevation: 10, // Android shadow/layering
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'white',
        backgroundColor: '#fff',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    plusBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FF3F85',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        elevation: 5,
    },
    avatarText: {
        fontSize: 32,
        fontFamily: FONTS.bold,
        color: 'white',
    },
    name: {
        fontSize: 26,
        fontFamily: FONTS.extraBold,
        color: '#1a1a1a',
        marginBottom: 5,
        marginTop: 15,
        letterSpacing: 0.5,
    },
    memberSince: {
        fontSize: 14,
        color: '#666',
        marginBottom: 30,
        fontFamily: FONTS.medium,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    statCard: {
        width: '47%',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        // Optional subtle border
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    statValue: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: '#1a1a1a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontFamily: FONTS.medium,
    },
    menuContainer: {
        width: '100%',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F8F9FA',
    },
    menuIconBox: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: '#1a1a1a',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#888',
        fontFamily: FONTS.regular,
    },
    logoutBtn: {
        marginTop: 20,
        padding: 10,
    },
    logoutText: {
        color: '#FF3B30',
        fontFamily: FONTS.semiBold,
        fontSize: 16,
    }
});

export default ProfileScreen;
