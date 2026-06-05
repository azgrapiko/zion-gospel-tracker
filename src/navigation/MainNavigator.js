import 'react-native-gesture-handler'; 
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore'; 

/** * VERIFIED IMPORTS BASE SA PROJECT EXPLORER
 */
import Sidebar from '../components/Sidebar'; 

// Screens Matrix Integration
import DashboardScreen from '../screens/Dashboard';
import ZionControl from '../screens/ZionControl';
import GospelScreen from '../screens/GospelScreen'; 
import ProfileScreen from '../screens/Profile/ProfileScreen'; // NAITUWD NA: Pinasok ang tamang Profile subfolder layer
import HelpFeedbackScreen from '../screens/HelpFeedbackScreen'; // VERIFIED IMPORT PATH
import AttendanceScreen from '../screens/AttendanceScreen'; // IN-IMPORT ANG BAGONG ATTENDANCE FILE
import EvangelistLog from '../screens/EvangelistLog'; // LIGTAS AT VERIFIED NA PAGKAKA-IMPORT NG BAGONG TAB

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/**
 * 1. TAB NAVIGATOR (BottomTabs Layout Configuration)
 */
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#121214', // High Contrast Dark Background
          borderTopColor: '#2c303b', // Sharper Border Frame Divider
          height: 65,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#26f7ff',
        tabBarInactiveTintColor: '#8a8f9e', // High Visibility Unselected Color
        tabBarLabelStyle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }
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
 * 2. MAIN NAVIGATOR (System Drawer Engine Framework)
 */
export default function MainNavigator() {
  // Hardened Role Gating Verification System
  const userProfile = useAuthStore(state => state.userProfile);
  const isAdmin = userProfile?.role === 'super_admin' || 
                  userProfile?.role === 'admin' || 
                  userProfile?.user_name === 'admin_plaridel' ||
                  userProfile?.user_name === 'Edgar24';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />} 
      screenOptions={{
        headerShown: true, 
        headerStyle: { 
          backgroundColor: '#121214', // High Contrast Material Dark Panel
          elevation: 0, 
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#2c303b' // Crisper High-Vis Border Alignment
        },
        headerTintColor: '#26f7ff',
        headerTitleStyle: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },
        drawerStyle: { backgroundColor: '#121214', width: 280 },
        drawerType: 'front',
      }}
    >
      {/* 1. DASHBOARD OVERVIEW MASTER FRAME */}
      <Drawer.Screen 
        name="Dashboard" 
        component={BottomTabs} 
        options={{ 
          title: 'ZION NETWORK',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="home" size={22} color={color} />
        }} 
      />

      {/* 2. GOSPEL CORE HUB */}
      <Drawer.Screen 
        name="Gospel" 
        component={GospelScreen} 
        options={{ 
          title: 'GOSPEL ACTIVITY',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="book-open-variant" size={22} color={color} />
        }} 
      />

      {/* 3. PROFILE HUB */}
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'USER PROFILE',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="account-details" size={22} color={color} />
        }} 
      />

      {/* 4. MY ZION MODULE - ADMIN SECURED GATEWAY */}
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

      {/* 5. ATTENDANCE MODULE - ADMIN SECURED GATEWAY */}
      {isAdmin && (
        <Drawer.Screen 
          name="Attendance" 
          component={AttendanceScreen} // Selyado: Ikinonekta na sa tunay na Attendance core component file
          options={{ 
            title: 'ATTENDANCE TRACKER',
            drawerIcon: ({color}) => <MaterialCommunityIcons name="calendar-check" size={22} color={color} />
          }} 
        />
      )}

      {/* 6. EVANGELIST LOG MODULE - BINUKSAN PARA SA LAHAT NG ROLES */}
      <Drawer.Screen 
        name="EvangelistLog" // Structural target key route matching the declaration inside Sidebar.js
        component={EvangelistLog} 
        options={{ 
          title: 'EVANGELIST LOG CENTER',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="file-document-edit" size={22} color={color} />
        }} 
      />

      {/* 7. HELP & FEEDBACK COMPONENT NODE */}
      <Drawer.Screen 
        name="Settings" // Structural key route matching the target inside Sidebar.js
        component={HelpFeedbackScreen} 
        options={{ 
          title: 'HELP & FEEDBACK',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="help-circle" size={22} color={color} />
        }} 
      />
    </Drawer.Navigator>
  );
}