import 'react-native-gesture-handler'; 
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore'; 

/** * VERIFIED IMPORTS BASE SA PROJECT EXPLORER
 */
import Sidebar from '../components/Sidebar'; 

// Screens
import DashboardScreen from '../screens/Dashboard';
import ZionControl from '../screens/ZionControl';
import GospelScreen from '../screens/GospelScreen'; 
import ProfileScreen from '../screens/Profile/ProfileScreen'; 

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/**
 * 1. TAB NAVIGATOR (BottomTabs)
 */
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#0a0a0a',
          borderTopColor: 'rgba(38, 247, 255, 0.1)', 
          height: 65,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#26f7ff',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' }
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
        options={{ 
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({color}) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="GospelTab" 
        component={GospelScreen} 
        options={{
          tabBarLabel: 'Gospel',
          tabBarIcon: ({color}) => <MaterialCommunityIcons name="book-open-variant" size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color}) => <MaterialCommunityIcons name="account-circle" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * 2. MAIN NAVIGATOR (Drawer)
 */
export default function MainNavigator() {
  // PHASE 1 FIX: Kinukuha ang userProfile para sa mas matibay na role check
  const userProfile = useAuthStore(state => state.userProfile);
  const isAdmin = userProfile?.role === 'super_admin' || 
                  userProfile?.role === 'admin' || 
                  userProfile?.user_name === 'admin_plaridel';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />} 
      screenOptions={{
        headerShown: true, 
        headerStyle: { 
          backgroundColor: '#0A0E12',
          elevation: 0, 
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(38, 247, 255, 0.1)'
        },
        headerTintColor: '#26f7ff',
        headerTitleStyle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
        drawerStyle: { backgroundColor: '#0A0E12', width: 280 },
        drawerType: 'front',
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={BottomTabs} 
        options={{ 
          title: 'ZION NETWORK',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="home" size={22} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="Gospel" 
        component={GospelScreen} 
        options={{ 
          title: 'GOSPEL ACTIVITY',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="book-open-variant" size={22} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'USER PROFILE',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="account-details" size={22} color={color} />
        }} 
      />

      {isAdmin && (
        <Drawer.Screen 
          name="Zion" 
          component={ZionControl} 
          options={{ 
            title: 'ZION CONTROL CENTER',
            drawerIcon: ({color}) => <MaterialCommunityIcons name="office-building" size={22} color={color} />
          }} 
        />
      )}
    </Drawer.Navigator>
  );
}