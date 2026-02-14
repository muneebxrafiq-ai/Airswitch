import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Dimensions,
} from 'react-native';
import { Button, Text, Title } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SIZES, FONTS, SPACING } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface OnboardingItem {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const onboardingData: OnboardingItem[] = [
    {
        id: '1',
        title: 'Welcome. Your internet is already ready.',
        description: 'Nigeria: Local multi-network coverage.',
        icon: 'calendar-check-outline', // Placeholder for "Calendar/Woman"
    },
    {
        id: '2',
        title: 'One phone. No SIM change. Works across countries.',
        description: 'Global / Travel: 190+ countries connectivity.',
        icon: 'cellphone-wireless', // Placeholder for "Phone"
    },
    {
        id: '3',
        title: 'Internet that follows you on the road, in cities, and across borders.',
        description: 'Both: Unified global and local experience.',
        icon: 'map-marker-path', // Placeholder for "Map"
    },
];

const OnboardingScreen = ({ navigation }: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            // "Get Started" goes to Login or IntentSelection depending on existing flow
            // Based on previous file, it was going to Login. We can check if 'IntentSelection' exists later.
            // For now, let's go to Login as per original file.
            navigation.replace('Login');
        }
    };

    const renderItem = ({ item }: { item: OnboardingItem }) => (
        <View style={styles.slide}>
            {/* Logo Placeholder (Top) */}
            <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="lightning-bolt" size={40} color={COLORS.primary} style={styles.logoIcon} />
            </View>

            {/* Text Content Top */}
            <View style={styles.textContainer}>
                <Title style={styles.title}>{item.title}</Title>
                <Text style={styles.description}>{item.description}</Text>
            </View>

            {/* Central Image Placeholder */}
            <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name={item.icon} size={80} color={COLORS.textSecondary} />
                </View>
            </View>
        </View>
    );

    const isLastSlide = currentIndex === onboardingData.length - 1;

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={onboardingData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                scrollEnabled
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                bounces={false}
            />

            {/* Pagination & Footer */}
            <View style={styles.footerContainer}>
                {/* Dots */}
                <View style={styles.indicatorsContainer}>
                    {onboardingData.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                index === currentIndex ? styles.activeIndicator : styles.inactiveIndicator,
                            ]}
                        />
                    ))}
                </View>

                {/* Button */}
                <Button
                    mode="contained"
                    onPress={handleNext}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                >
                    {isLastSlide ? 'Get Started' : 'Next'}
                </Button>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    slide: {
        width: width,
        paddingHorizontal: SPACING.l,
        alignItems: 'center',
        paddingTop: SPACING.m,
    },
    logoContainer: {
        marginBottom: SPACING.l,
        width: '100%',
        alignItems: 'center',
    },
    logoIcon: {
        // gradient effect not simple in vector icons, using solid primary for now
    },
    textContainer: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        textAlign: 'center',
        color: COLORS.black,
        marginBottom: SPACING.s,
        lineHeight: 30,
    },
    description: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        textAlign: 'center',
        color: COLORS.textSecondary,
        lineHeight: 20,
        paddingHorizontal: SPACING.m,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
        width: '100%',
    },
    imagePlaceholder: {
        width: 250,
        height: 250,
        backgroundColor: '#F3F4F6', // Light gray background
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerContainer: {
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.xl,
    },
    indicatorsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.l,
    },
    indicator: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    activeIndicator: {
        backgroundColor: COLORS.textSecondary, // Use dark gray for active dot
        width: 20,
    },
    inactiveIndicator: {
        backgroundColor: '#E5E7EB', // Use light gray for inactive
        width: 6,
    },
    button: {
        backgroundColor: COLORS.textSecondary, // Grey button from screenshots ("Next" button seems grey/disabled looking or just secondary style)
        // Checking screenshot again -> button is grey.
        borderRadius: 8,
    },
    buttonContent: {
        height: 48,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});

export default OnboardingScreen;
