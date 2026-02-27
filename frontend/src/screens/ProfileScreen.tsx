import React from 'react';
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050816', '#050816', '#101827']}
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
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialCommunityIcons name="bell-outline" size={22} color="#E5E7EB" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialCommunityIcons name="cog-outline" size={22} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <Text style={styles.searchText}>Search Country</Text>
          </TouchableOpacity>

          {/* Current plan card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>Global 10GB</Text>
              </View>
              <TouchableOpacity>
                <MaterialCommunityIcons name="dots-horizontal" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.planDataLeft}>8.7GB left</Text>
            <Text style={styles.planDataTotal}>Out of 10GB</Text>
            <Text style={styles.planValidity}>Validity: Feb 28 2026</Text>
            <TouchableOpacity style={styles.planButton} activeOpacity={0.9}>
              <Text style={styles.planButtonText}>See Details</Text>
            </TouchableOpacity>
          </View>

          {/* Shortcuts */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Shortcut</Text>
          </View>
          <View style={styles.shortcutsRow}>
            <TouchableOpacity
              style={styles.shortcutCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SelectPlan', {})}
            >
              <MaterialCommunityIcons name="cart-outline" size={24} color="#2563EB" />
              <Text style={styles.shortcutLabel}>Buy Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('TopUp')}
            >
              <MaterialCommunityIcons name="wallet-outline" size={24} color="#7C3AED" />
              <Text style={styles.shortcutLabel}>Top Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} activeOpacity={0.9}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color="#059669" />
              <Text style={styles.shortcutLabel}>Coverage</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} activeOpacity={0.9}>
              <MaterialCommunityIcons name="headset-outline" size={24} color="#F97316" />
              <Text style={styles.shortcutLabel}>Support</Text>
            </TouchableOpacity>
          </View>

          {/* Auto switch card */}
          <View style={styles.autoSwitchCard}>
            <View>
              <Text style={styles.autoTitle}>Auto Switch Active</Text>
              <Text style={styles.autoSubtitle}>Automatic Network Switching</Text>
            </View>
            <View style={styles.autoStatusPill}>
              <View style={styles.autoDot} />
              <Text style={styles.autoStatusText}>Enabled</Text>
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
    paddingHorizontal: 20,
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
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4B5563',
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
    fontFamily: FONTS.semiBold,
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
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20,
  },
  searchText: {
    color: '#9CA3AF',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  planCard: {
    backgroundColor: '#020617',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  planBadgeText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  planDataLeft: {
    color: '#F9FAFB',
    fontSize: 24,
    fontFamily: FONTS.extraBold,
  },
  planDataTotal: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  planValidity: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    fontFamily: FONTS.regular,
  },
  planButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1D4ED8',
  },
  planButtonText: {
    color: '#F9FAFB',
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shortcutCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#020617',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 8,
  },
  shortcutLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  autoSwitchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  autoTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  autoSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  autoStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#022C22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  autoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  autoStatusText: {
    color: '#BBF7D0',
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

