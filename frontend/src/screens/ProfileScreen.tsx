import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../theme';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();

  const initial = user?.name?.[0] || 'T';
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);

  const shortcutTiles = useMemo(
    () => [
      {
        key: 'buy',
        label: 'Buy Plan',
        icon: 'cart-outline' as const,
        variant: 'light' as const,
        onPress: () => navigation.navigate('SelectPlan', {}),
      },
      {
        key: 'topup',
        label: 'Top Up',
        icon: 'credit-card-outline' as const,
        variant: 'light' as const,
        onPress: () => navigation.navigate('TopUp'),
      },
      {
        key: 'coverage',
        label: 'Coverage',
        icon: 'access-point' as const,
        variant: 'dark' as const,
        onPress: () => { },
      },
      {
        key: 'support',
        label: 'Support',
        icon: 'headset' as const,
        variant: 'dark' as const,
        onPress: () => { },
      },
    ],
    [navigation]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#171923', '#171923']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with avatar and icons */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
              <View>
                <Text style={styles.greetingLabel}>Hi</Text>
                <Text style={styles.greetingName}>{user?.name || 'Emmanuel A.'}</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.85}>
                <View style={styles.notificationDot} />
                <MaterialCommunityIcons name="bell-outline" size={22} color="#E5E7EB" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.85} onPress={() => navigation.navigate('ProfileSettings')}>
                <MaterialCommunityIcons name="menu" size={22} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search row */}
          <View style={styles.searchRow}>
            <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
              <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
              <Text style={styles.searchText}>Search Country</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="view-grid-outline" size={20} color="#E5E7EB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          {/* Current plan card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleRow}>
                <MaterialCommunityIcons name="sim" size={18} color="#CBD5E1" />
                <Text style={styles.planTitleText}>Global 10GB</Text>
              </View>
              <TouchableOpacity style={styles.seeDetailsPill} activeOpacity={0.85}>
                <Text style={styles.seeDetailsText}>See Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            <Text style={styles.planDataLeft}>8.7GB left</Text>
            <Text style={styles.planDataTotal}>Out of 10GB</Text>
            <Text style={styles.planValidity}>Validity: Feb 28 2026</Text>
          </View>

          {/* Shortcuts */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Shortcut</Text>
          </View>
          <View style={styles.shortcutsGrid}>
            {shortcutTiles.map((tile) => (
              <TouchableOpacity
                key={tile.key}
                style={[
                  styles.shortcutTile,
                  tile.variant === 'light' ? styles.shortcutTileLight : styles.shortcutTileDark,
                ]}
                activeOpacity={0.9}
                onPress={tile.onPress}
              >
                <Text
                  style={[
                    styles.shortcutLabel,
                    tile.variant === 'light' ? styles.shortcutLabelLight : styles.shortcutLabelDark,
                  ]}
                >
                  {tile.label}
                </Text>
                <MaterialCommunityIcons
                  name={tile.icon}
                  size={20}
                  color={tile.variant === 'light' ? '#E5E7EB' : '#E5E7EB'}
                  style={styles.shortcutIcon}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Auto switch card */}
          <View style={styles.autoSwitchCard}>
            <View>
              <Text style={styles.autoTitle}>Auto Switch Active</Text>
              <Text style={styles.autoSubtitle}>Automatic Network Switching</Text>
            </View>
            <View style={styles.autoRight}>
              <Text style={styles.autoEnabledText}>Enabled</Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#F87171" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  avatarInitial: {
    color: '#F9FAFB',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  greetingLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  greetingName: {
    color: '#F9FAFB',
    fontSize: 16,
    fontFamily: FONTS.spaceGroteskBold,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#171923',
    zIndex: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D3748',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  searchText: {
    color: '#A0AEC0',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  planCard: {
    backgroundColor: '#1A2235',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTitleText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontFamily: FONTS.hankenGroteskSemiBold,
  },
  seeDetailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3C4858',
    borderWidth: 1,
    borderColor: '#4A5568',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  seeDetailsText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  planDataLeft: {
    color: '#F9FAFB',
    fontSize: 24,
    fontFamily: FONTS.extraBold,
  },
  planDataTotal: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  planValidity: {
    color: '#A0AEC0',
    fontSize: 12,
    marginTop: 8,
    fontFamily: FONTS.regular,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 18,
  },
  shortcutTile: {
    width: '48%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortcutTileLight: {
    backgroundColor: '#BFD9FF',
  },
  shortcutTileDark: {
    backgroundColor: '#596B85',
    borderWidth: 1,
    borderColor: '#7A8B9E',
  },
  shortcutLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  shortcutLabelLight: {
    color: '#0B1220',
    fontFamily: FONTS.semiBold,
  },
  shortcutLabelDark: {
    color: '#F8FAFC',
    fontFamily: FONTS.semiBold,
  },
  shortcutIcon: {
    opacity: 0.9,
  },
  autoSwitchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2235',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginBottom: 24,
  },
  autoTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  autoSubtitle: {
    color: '#A0AEC0',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  autoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoEnabledText: {
    color: '#34D399',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  logoutBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#F87171',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});

export default ProfileScreen;

