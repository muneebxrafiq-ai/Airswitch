import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import CheckoutScreen from '../screens/CheckoutScreen';
import OTPScreen from '../screens/OTPScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TopUpScreen from '../screens/TopUpScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SelectPlanScreen from '../screens/SelectPlanScreen';
import ActivationScreen from '../screens/ActivationScreen';
import SuccessScreen from '../screens/SuccessScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import MyESimsScreen from '../screens/MyESimsScreen';
import ESimDetailsScreen from '../screens/ESimDetailsScreen';
import ProfileCreationScreen from '../screens/ProfileCreationScreen';
import IntentSelectionScreen from '../screens/IntentSelectionScreen';
import SelectESimScreen from '../screens/SelectESimScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { user, loading, hasSeenOnboarding, setHasSeenOnboarding } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    // specific logic to determine start screen
    const getInitialRoute = () => {
        if (!user) return 'Login'; // Not used in Auth Stack but good for logic
        if (!user.name || user.name === "") return 'ProfileCreation';
        return 'IntentSelection'; // Default flow
    };

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <Stack.Group>
                        {/* We can't easily dynamically set initialRouteName on a single Navigator if we swap stacks conditionally.
                            But since we are here, we can just put ProfileCreation as the first route IF needed, 
                            OR use a specific Logic.
                            React Navigation 6 recommends using condition to render different screens or stacks.
                        */}

                        {!user.name || user.name === "" ? (
                            <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
                        ) : null}

                        <Stack.Screen name="IntentSelection" component={IntentSelectionScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Dashboard" component={MainTabNavigator} />
                        <Stack.Screen name="Checkout" component={CheckoutScreen} />
                        <Stack.Screen name="TopUp" component={TopUpScreen} />
                        <Stack.Screen name="SelectPlan" component={SelectPlanScreen} />
                        <Stack.Screen name="Activation" component={ActivationScreen} />
                        <Stack.Screen name="SuccessScreen" component={SuccessScreen} />

                        <Stack.Screen name="ReferralsScreen" component={ReferralsScreen} />
                        <Stack.Screen name="MyESims" component={MyESimsScreen} />
                        <Stack.Screen name="SelectESim" component={SelectESimScreen} options={{ title: 'Select eSIM' }} />
                        <Stack.Screen name="ESimDetails" component={ESimDetailsScreen} options={{ headerShown: false }} />
                    </Stack.Group>
                ) : (
                    <Stack.Group>
                        {!hasSeenOnboarding && (
                            <Stack.Screen
                                name="Onboarding"
                                component={OnboardingScreen}
                                listeners={{
                                    beforeRemove: () => {
                                        setHasSeenOnboarding(true);
                                    }
                                }}
                            />
                        )}
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="OTP" component={OTPScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
