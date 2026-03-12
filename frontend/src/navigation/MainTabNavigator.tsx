import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import MyESimsScreen from '../screens/MyESimsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 30 : 20,
                    left: 20,
                    right: 20,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: 'rgba(23, 25, 35, 0.95)', // Based on theme background
                    borderTopWidth: 0,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    paddingBottom: 12,
                    paddingTop: 12,
                    elevation: 15,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                },
                tabBarActiveTintColor: COLORS.white,
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    marginTop: 2,
                },
                tabBarIconStyle: {
                    marginBottom: -4,
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="home" color={color} size={22} />
                    )
                }}
            />
            <Tab.Screen
                name="My eSIM"
                component={MyESimsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="globe" color={color} size={22} />
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="user" color={color} size={22} />
                    )
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
