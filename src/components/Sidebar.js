import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import useAuthStore from '../store/authStore';

// Pinalitan ang props: Inalis ang 'onLogout' at 'currentRoute', pinalitan ng 'state'
export default function Sidebar({ navigation, state }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState(false);
  
  const { userProfile } = useAuthStore();
  
  const isExpanded = !collapsed || hover;

  // PHASE 2 FIX: Kinukuha ang current route name mula sa state index
  const currentRoute = state?.routeNames?.[state.index];

  // Hardened Admin Check
  const isAdmin = userProfile?.user_name === 'admin_plaridel' || 
                  userProfile?.user_name === 'Edgar24' || 
                  userProfile?.role === 'admin' ||
                  userProfile?.role === 'super_admin';

  const handleLogoutPress = () => {
    const logoutMsg = "Wow, Good Job po, Many blessing 👏\n\nI-click muli ang OK sa pag-logout";
    
    // PHASE 2 FIX: Direktang Supabase signOut
    const confirmLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Logout Error:", error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(logoutMsg)) confirmLogout();
    } else {
      Alert.alert(
        "Logout",
        logoutMsg,
        [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: confirmLogout }
        ]
      );
    }
  };

  const MenuItem = ({ icon, title, target, isActive }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isActive && styles.activeItem]} 
      onPress={() => navigation.navigate(target)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={isActive ? "#26f7ff" : "#5dade2"} 
        />
      </View>
      {isExpanded && (
        <Text style={[styles.menuText, isActive && styles.activeText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View 
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false)
      } : {})}
      style={[styles.sidebar, { width: isExpanded ? 240 : 80 }]}
    >
      {/* HEADER / TOGGLE */}
      <TouchableOpacity 
        onPress={() => setCollapsed(!collapsed)} 
        style={styles.toggle}
        activeOpacity={0.5}
      >
        <MaterialCommunityIcons 
          name={isExpanded ? "chevron-left-box" : "menu"} 
          size={28} 
          color="#26f7ff" 
        />
      </TouchableOpacity>

      <View style={styles.itemsContainer}>
        {/* DASHBOARD */}
        <MenuItem 
          icon="view-dashboard-outline" 
          title="Dashboard" 
          target="Dashboard" 
          isActive={currentRoute === 'Dashboard'}
        />

        {/* MY ZION - Admin Only */}
        {isAdmin && (
          <MenuItem 
            icon="office-building-marker" 
            title="My Zion" 
            target="Zion"
            isActive={currentRoute === 'Zion'}
          />
        )}

        <MenuItem 
          icon="calendar-check-outline" 
          title="Attendance" 
          target="Attendance" 
          isActive={currentRoute === 'Attendance'}
        />
        
        {/* GOSPEL ACTIVITY HUB */}
        <MenuItem 
          icon="book-open-page-variant-outline" 
          title="Gospel Activity" 
          target="Gospel" 
          isActive={currentRoute === 'Gospel'}
        />
        
        {/* PROFILE USER */}
        <MenuItem 
          icon="account-circle-outline" 
          title="Your Profile" 
          target="Profile" 
          isActive={currentRoute === 'Profile'}
        />
        
        <MenuItem 
          icon="cog-sync-outline" 
          title="Settings" 
          target="Settings" 
          isActive={currentRoute === 'Settings'}
        />
      </View>

      {/* LOGOUT SECTION */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="power" size={24} color="#ff5555" />
        </View>
        {isExpanded && <Text style={styles.logoutText}>Sign Out</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: '#0a0a0a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(38, 247, 255, 0.2)',
    paddingVertical: 10,
  },
  toggle: { 
    paddingVertical: 20, 
    alignItems: 'center',
    marginBottom: 10
  },
  itemsContainer: { flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 12,
  },
  iconWrapper: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeItem: {
    backgroundColor: 'rgba(38, 247, 255, 0.08)',
  },
  menuText: { 
    color: '#a0a0a0', 
    marginLeft: 15, 
    fontSize: 14,
    fontWeight: '500'
  },
  activeText: { 
    color: '#26f7ff', 
    fontWeight: '800' 
  },
  logoutBtn: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#222',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  logoutText: { 
    color: '#ff5555', 
    marginLeft: 15, 
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1
  }
});