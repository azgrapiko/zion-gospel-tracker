import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Image, Platform, Dimensions, Alert, ActivityIndicator, useWindowDimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase'; // Tiyaking tama ang path
import useAuthStore from '../../store/authStore';
import AvatarPicker from './AvatarPicker';
import NotificationSetup from './NotificationSetup';

const isWeb = Platform.OS === 'web';

export default function ProfileScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const { userProfile, setUserProfile } = useAuthStore();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // STABLE AVATAR LOGIC
  const userAvatar = (userProfile?.avatar_url && userProfile.avatar_url !== "[object Object]") 
    ? (typeof userProfile.avatar_url === 'number' ? userProfile.avatar_url : { uri: String(userProfile.avatar_url) })
    : require('../../../assets/man5.png');

  const handlePasswordRequest = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.email) {
        throw new Error("Hindi mahanap ang iyong account details.");
      }

      const isAdmin = user.email.toLowerCase().endsWith('@zion.com');

      if (isAdmin) {
        // ======================================================================
        // ⭐ ORIGINAL ADMIN CODE: HINDI GINALAW KAHIT ISANG TULDOK DAHIL SUBOK NA GUMAGANA
        // ======================================================================
        if (isWeb) {
          const newPass = window.prompt("Admin Security: Enter new password (min. 6 chars):");
          if (newPass && newPass.length >= 6) executePasswordUpdate(newPass);
          else if (newPass) alert("Password is too short.");
        } else {
          Alert.prompt(
            "Admin Security Access",
            "Enter your new secure password (min. 6 characters):",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Update Now", 
                onPress: (newPass) => {
                  if (newPass.length < 6) Alert.alert("Error", "Password is too short.");
                  else executePasswordUpdate(newPass);
                }
              }
            ],
            "secure-text"
          );
        }
        // ======================================================================
      } else {
        // ======================================================================
        // 🛠️ FIX FOR MEMBERS: Ginaya ang estratehiya ng Admin gamit ang direct updates 
        // para lumabas agad ang Success Alert na nasa loob ng executePasswordUpdate
        // ======================================================================
        if (isWeb) {
          const newPass = window.prompt("I-update ang Password: Maglagay ng bagong password (min. 6 chars):");
          if (newPass && newPass.length >= 6) {
            executePasswordUpdate(newPass); // Diretsong pasok sa execute block
          } else if (newPass) {
            alert("Masyadong maikli ang password. Tiyaking ito ay may 6 o higit pang karakter.");
          }
        } else {
          Alert.prompt(
            "I-update ang Password",
            "Ipasok ang iyong bagong secure password (minimum na 6 na karakter):",
            [
              { text: "Kanselahin", style: "cancel" },
              { 
                text: "I-save Ngayon", 
                onPress: (newPass) => {
                  if (newPass.length < 6) {
                    Alert.alert("System Security", "Masyadong maikli ang password.");
                  } else {
                    executePasswordUpdate(newPass); // Diretsong pasok sa execute block
                  }
                }
              }
            ],
            "secure-text"
          );
        }
        // ======================================================================
      }
    } catch (error) {
      console.error("Security Logic Error:", error.message);
      Alert.alert("System Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // WALANG GALAW DITO DAHIL DITO NAKALAGAY ANG IYONG "SUCCESS ALERT" POPUP NA GUMAGANA NA
  const executePasswordUpdate = async (newPassword) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      if (isWeb) {
        alert("Success: Ang iyong password ay matagumpay na na-update! 🔐");
      } else {
        Alert.alert("Success", "Ang iyong password ay matagumpay na na-update! 🔐");
      }
    } catch (error) {
      console.error("Update Error:", error.message);
      Alert.alert("System Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarSelect = async (selectedImgSource) => {
    setIsPickerVisible(false);
    setIsUpdating(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) throw new Error("User authentication failed.");

      let dbValue;
      if (typeof selectedImgSource === 'number') {
        dbValue = selectedImgSource;
      } else if (typeof selectedImgSource === 'object' && selectedImgSource?.uri) {
        dbValue = String(selectedImgSource.uri);
      } else {
        dbValue = String(selectedImgSource);
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: dbValue })
        .eq('id', user.id);

      if (dbError) {
        console.error("Supabase DB Error:", dbError.message);
        throw new Error("Hindi mahanap ang 'avatar_url' column o error sa database communication.");
      }

      setUserProfile({ ...userProfile, avatar_url: dbValue });

      if (Platform.OS === 'web') {
        console.log("✅ Avatar updated successfully!");
      } else {
        Alert.alert("Success", "Naka-save na ang iyong bagong Avatar character! ✨");
      }

    } catch (error) {
      console.error("Avatar Update Error:", error.message);
      Alert.alert("System Error", error.message || "Hindi ma-save ang Avatar. Pakisubukang muli.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {isUpdating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#26f7ff" />
          <Text style={styles.loadingText}>System Syncing...</Text>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <Image source={userAvatar} style={styles.profileImg} />
              <TouchableOpacity 
                style={styles.editBadge} 
                onPress={() => setIsPickerVisible(true)}
              >
                <MaterialCommunityIcons name="camera-plus" size={18} color="#050505" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.userName}>{userProfile?.full_name || "Zion Member"}</Text>
          <Text style={styles.userHandle}>@{userProfile?.user_name || 'username'}</Text>
        </View>

        {/* PREMIUM HIGH CONTRAST SYSTEM IDENTITY CARD */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>SYSTEM IDENTITY</Text>
          <View style={styles.infoGrid}>
            <InfoBox label="ZION CODE" value={userProfile?.zion_code || 'PLA'} icon="identifier" color="#26f7ff" />
            <InfoBox label="AGE GROUP" value={userProfile?.group_age || 'N/A'} icon="account-group" color="#26f7ff" />
            <InfoBox label="LMS LEVEL" value={userProfile?.lms_level || 'Level 1'} icon="school" color="#26f7ff" />
            <InfoBox label="STATUS" value="ACTIVE" icon="shield-check" color="#2ecc71" />
          </View>
        </View>

        {/* NOTIFICATION ENGINE SECTION */}
        <View style={styles.notificationWrapper}>
          <NotificationSetup />
        </View>

        <TouchableOpacity style={styles.passwordBtn} onPress={handlePasswordRequest}>
          <MaterialCommunityIcons name="lock-reset" size={18} color="#ff4d4d" />
          <Text style={styles.passwordText}>Request Change Password</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Gem-tech Alpha System v2.0</Text>
      </ScrollView>

      <AvatarPicker 
        visible={isPickerVisible} 
        onClose={() => setIsPickerVisible(false)} 
        onSelect={handleAvatarSelect}
      />
    </View>
  );
}

// Sub-component containing re-sized high visibility data parameters
const InfoBox = ({ label, value, icon, color = "#26f7ff" }) => (
  <View style={styles.infoBox}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <View style={styles.infoTextGroup}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#050505' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  loadingText: { color: '#26f7ff', marginTop: 10, fontWeight: 'bold' },
  scrollContent: { 
    paddingBottom: 40,
    alignItems: 'center', 
    width: '90%',
    alignSelf: 'center' 
  },
  profileHeader: { 
    alignItems: 'center', 
    marginTop: 25, 
    marginBottom: 20 
  },
  avatarWrapper: { marginBottom: 10 },
  avatarRing: { 
    width: 104, height: 104, borderRadius: 52, 
    borderWidth: 2, borderColor: '#26f7ff', 
    padding: 3, justifyContent: 'center', alignItems: 'center' 
  },
  profileImg: { width: 92, height: 92, borderRadius: 46 },
  editBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#26f7ff', padding: 6, borderRadius: 12,
    elevation: 4
  },
  userName: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  userHandle: { color: '#a2a8b6', fontSize: 13, marginTop: 2 },
  
  // Premium Material Dark High Contrast Base Structure
  glassCard: { 
    width: '92%', 
    backgroundColor: '#121214', 
    borderRadius: 12, 
    paddingVertical: 18,
    paddingHorizontal: 20, 
    borderWidth: 1, 
    borderColor: '#2c303b', 
    marginBottom: 12,
    alignSelf: 'center'
  },
  notificationWrapper: {
    width: '92%', 
    marginBottom: 12,
    alignSelf: 'center'
  },
  cardLabel: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 16, letterSpacing: 1.5 },
  infoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between'
  },
  
  // Re-sized Info Display Parameters
  infoBox: { 
    width: '48%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16
  },
  infoTextGroup: { marginLeft: 10, flex: 1 },
  infoLabel: { color: '#8a8f9e', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  infoValue: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginTop: 2 },

  passwordBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, width: '92%', borderRadius: 10, backgroundColor: 'rgba(255, 77, 77, 0.04)',
    borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.2)', marginTop: 8,
    alignSelf: 'center'
  },
  passwordText: { color: '#ff4d4d', marginLeft: 8, fontWeight: '900', fontSize: 12 },
  footerText: { color: '#2c303b', fontSize: 9, marginTop: 24, fontWeight: '900', letterSpacing: 0.5 }
});