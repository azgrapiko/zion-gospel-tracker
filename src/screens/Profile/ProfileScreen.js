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
      } else {
        setIsUpdating(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: isWeb ? window.location.origin : 'safetrip://update-password',
        });

        if (resetError) throw resetError;

        Alert.alert(
          "Security Link Sent",
          `Ang password reset link ay ipinadala sa ${user.email}. Pakisuri ang iyong inbox.`
        );
      }
    } catch (error) {
      console.error("Security Logic Error:", error.message);
      Alert.alert("System Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

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
                <MaterialCommunityIcons name="camera-plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.userName}>{userProfile?.full_name || "Zion Member"}</Text>
          <Text style={styles.userHandle}>@{userProfile?.user_name || 'username'}</Text>
        </View>

        {/* RE-SIZED SYSTEM IDENTITY CARD */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>SYSTEM IDENTITY</Text>
          <View style={styles.infoGrid}>
            <InfoBox label="ZION CODE" value={userProfile?.zion_code || 'PLA'} icon="identifier" />
            <InfoBox label="AGE GROUP" value={userProfile?.age_group || 'N/A'} icon="account-group" />
            <InfoBox label="LMS LEVEL" value={userProfile?.lms_level || 'Level 1'} icon="school" />
            <InfoBox label="STATUS" value="ACTIVE" icon="shield-check" color="#26f7ff" />
          </View>
        </View>

        {/* RE-SIZED NOTIFICATION ENGINE */}
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

const InfoBox = ({ label, value, icon, color = "#5dade2" }) => (
  <View style={styles.infoBox}>
    <MaterialCommunityIcons name={icon} size={16} color={color} />
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
    width: '100%',
    alignSelf: 'center' 
  },
  profileHeader: { 
    alignItems: 'center', 
    marginTop: 25, 
    marginBottom: 20 
  },
  avatarWrapper: { marginBottom: 10 },
  avatarRing: { 
    width: 100, height: 100, borderRadius: 50, 
    borderWidth: 2, borderColor: '#26f7ff', 
    padding: 3, justifyContent: 'center', alignItems: 'center' 
  },
  profileImg: { width: 88, height: 88, borderRadius: 44 },
  editBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#26f7ff', padding: 5, borderRadius: 12,
    elevation: 4
  },
  userName: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  userHandle: { color: '#666', fontSize: 12, marginTop: 2 },
  
  glassCard: { 
    width: '92%', // Binawasan ang lapad para hindi dikit sa gilid ng phone
    backgroundColor: '#0a0a0a', 
    borderRadius: 12, 
    paddingVertical: 15,
    paddingHorizontal: 20, 
    borderWidth: 1, 
    borderColor: '#151515', 
    marginBottom: 12,
    alignSelf: 'center'
  },
  notificationWrapper: {
    width: '92%', // Pantay na sa System Identity card
    marginBottom: 12,
    alignSelf: 'center'
  },
  cardLabel: { color: '#444', fontSize: 8, fontWeight: '900', marginBottom: 12, letterSpacing: 1.2 },
  infoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' // Ibinabalik sa proper spacing pero kontrolado ng width
  },
  infoBox: { 
    width: '45%', // Mas maliit na width para siksik sa gitna
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  infoTextGroup: { marginLeft: 8, flex: 1 },
  infoLabel: { color: '#555', fontSize: 7, fontWeight: 'bold' },
  infoValue: { color: '#bbb', fontSize: 11, fontWeight: '600', marginTop: 1 },

  passwordBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 10, width: '92%', borderRadius: 10, backgroundColor: 'rgba(255, 77, 77, 0.02)',
    borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.1)', marginTop: 5,
    alignSelf: 'center'
  },
  passwordText: { color: '#ff4d4d', marginLeft: 8, fontWeight: '700', fontSize: 11 },
  footerText: { color: '#1a1a1a', fontSize: 8, marginTop: 20, fontWeight: 'bold' }
});