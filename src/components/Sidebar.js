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

  // Hardened Admin & Super Admin Verification Gate
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

  // Re-sized Menu Item Component Injection
  const MenuItem = ({ icon, title, target, isActive }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isActive && styles.activeItem]} 
      onPress={() => navigation.navigate(target)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons 
          name={icon} 
          size={28} // Pinalaki para sa mas mataas na visibility
          color={isActive ? "#26f7ff" : "#8a8f9e"} // High Contrast Active Shift
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
      style={[styles.sidebar, { width: isExpanded ? 260 : 85 }]} 
    >
      {/* HEADER / TOGGLE */}
      <TouchableOpacity 
        onPress={() => setCollapsed(!collapsed)} 
        style={styles.toggle}
        activeOpacity={0.5}
      >
        <MaterialCommunityIcons 
          name={isExpanded ? "chevron-left-box" : "menu"} 
          size={32} 
          color="#26f7ff" 
        />
      </TouchableOpacity>

      <View style={styles.itemsContainer}>
        {/* [PUBLIC] 1. DASHBOARD */}
        <MenuItem 
          icon="view-dashboard-outline" 
          title="Dashboard" 
          target="Dashboard" 
          isActive={currentRoute === 'Dashboard'}
        />

        {/* [PUBLIC] 2. GOSPEL ACTIVITY HUB */}
        <MenuItem 
          icon="book-open-page-variant-outline" 
          title="Gospel Activity" 
          target="Gospel" 
          isActive={currentRoute === 'Gospel'}
        />
        
        {/* [PUBLIC] 3. PROFILE USER */}
        <MenuItem 
          icon="account-circle-outline" 
          title="Your Profile" 
          target="Profile" 
          isActive={currentRoute === 'Profile'}
        />

        {/* [ADMIN ONLY] 4. MY ZION */}
        {isAdmin && (
          <MenuItem 
            icon="office-building-marker" 
            title="My Zion" 
            target="Zion"
            isActive={currentRoute === 'Zion'}
          />
        )}

        {/* [ADMIN ONLY] 5. ATTENDANCE */}
        {isAdmin && (
          <MenuItem 
            icon="calendar-check" 
            title="Attendance" 
            target="Attendance" 
            isActive={currentRoute === 'Attendance'}
          />
        )}

        {/* [PUBLIC] 6. EVANGELIST LOG - Ngayon ay accessible na para sa lahat ng uri ng member profiles */}
        <MenuItem 
          icon="file-document-edit-outline" 
          title="Evangelist Log" 
          target="EvangelistLog" 
          isActive={currentRoute === 'EvangelistLog'}
        />
        
        {/* [PUBLIC] 7. HELP & FEEDBACK (Target structural route name is linked to 'Settings') */}
        <MenuItem 
          icon="help-circle-outline" 
          title="Help & Feedback" 
          target="Settings" 
          isActive={currentRoute === 'Settings'}
        />
      </View>

      {/* 8. LOGOUT SECTION */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="power" size={28} color="#ff4d4d" />
        </View>
        {isExpanded && <Text style={styles.logoutText}>Sign Out</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Premium Material Dark Navigation Framework
  sidebar: {
    height: '100%',
    backgroundColor: '#121214', 
    borderRightWidth: 1,
    borderRightColor: '#2c303b', 
    paddingVertical: 12,
  },
  toggle: { 
    paddingVertical: 16, 
    alignItems: 'center',
    marginBottom: 15
  },
  itemsContainer: { flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, 
    paddingHorizontal: 16,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 12,
  },
  iconWrapper: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeItem: {
    backgroundColor: 'rgba(38, 247, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(38, 247, 255, 0.15)'
  },
  
  // High Visibility Sizing Core Config
  menuText: { 
    color: '#ffffff', 
    marginLeft: 12, 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.5
  },
  activeText: { 
    color: '#26f7ff', 
    fontWeight: '900' 
  },
  
  logoutBtn: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e2026',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  logoutText: { 
    color: '#ff4d4d', 
    marginLeft: 12, 
    fontWeight: '900',
    fontSize: 15, 
    letterSpacing: 1
  }
});