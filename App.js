import 'react-native-gesture-handler'; // Mahalaga para sa Drawer Navigation
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

// --- IMPORTING UTILS & STORE ---
import { supabase } from './src/utils/supabase';
import useAuthStore from './src/store/authStore';

// --- NAVIGATION & SCREENS (CORRECTED PATHS) ---
import MainNavigator from './src/navigation/MainNavigator'; 
// Inayos mula sa components/screens patungong screens folder
import LoginScreen from './src/screens/LoginScreen'; 

export default function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const userProfile = useAuthStore((state) => state.userProfile);
  const isApproved = useAuthStore((state) => state.isApproved);

  // Local State para sa Initializing
  const [initializing, setInitializing] = useState(true);
const [fontsLoaded, setFontsLoaded] = useState(false);

  // 🛠️ DIAGNOSTIC CHECK
  console.log("🛠️ ZION SYSTEM CHECK:", { 
    initializing, 
    hasProfile: !!userProfile, 
    isApproved,
    zionCode: useAuthStore.getState()?.zionCode 
  });

  useEffect(() => {

    const loadFonts = async () => {
  await Font.loadAsync({
    ...MaterialCommunityIcons.font,
  });

  setFontsLoaded(true);
};

loadFonts();

    // ⚡ SAFETY TIMER: Pinapatay ang spinner pagkalipas ng 6 seconds (Plaridel Net Proof)
    const safetyTimer = setTimeout(() => {
      if (initializing || !fontsLoaded) {
        console.warn("⚠️ SAFETY TIMER: Auth is hanging, forcing spinner OFF.");
        setInitializing(false);
      }
    }, 6000);

    const initializeApp = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          console.log("🔑 Session active for:", session.user.email);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(); 
          
          if (profileError) console.error("Profile Fetch Error:", profileError);
          
          // I-update ang store gamit ang profile data o default member data
          setAuth(profile || { 
            id: session.user.id, 
            user_name: session.user.email,
            role: 'member',
            is_approved: false
          });
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error("❌ CRITICAL INIT ERROR:", err.message);
        clearAuth();
      } finally {
        setInitializing(false); 
      }
    };

    initializeApp();

    // AUTH LISTENER: Para sa real-time login/logout events
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        supabase.from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            setAuth(profile || { id: session.user.id, user_name: session.user.email });
            setInitializing(false); 
          })
          .catch(() => setInitializing(false));
      } else {
        clearAuth();
        setInitializing(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 1. LOADING SCREEN
  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#26f7ff" />
        <Text style={styles.loadingText}>GEM-TECH ALPHA INITIALIZING...</Text>
        <Text style={{ color: '#555', marginTop: 10, fontSize: 8 }}>Please wait, validating Zion Connection...</Text>
      </View>
    );
  }

  // 2. UNAUTHENTICATED
  if (!userProfile) {
    return <LoginScreen />;
  }

  // 3. PENDING APPROVAL GATE
  if (!isApproved) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>ACCESS PENDING</Text>
        <Text style={styles.subtitle}>Hi {userProfile.full_name || userProfile.user_name || 'User'},</Text>
        <Text style={styles.message}>
          Your account for Zion [{useAuthStore.getState()?.zionCode || 'N/A'}] is waiting for Super Admin approval.
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={async () => {
            await supabase.auth.signOut();
            clearAuth();
            setInitializing(true);
            setTimeout(() => setInitializing(false), 800);
          }}
        >
          <Text style={styles.buttonText}>LOGOUT / REFRESH</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 4. AUTHORIZED MAIN DASHBOARD
  return (
    <NavigationContainer>
      <View style={{ flex: 1, backgroundColor: '#0A0E12' }}>
        <MainNavigator />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0A0E12',
    padding: 20
  },
  loadingText: { color: '#26f7ff', marginTop: 15, fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  title: { color: '#26f7ff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#fff', fontSize: 16, marginBottom: 10 },
  message: { color: '#aaa', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  button: { 
    backgroundColor: 'transparent', 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 5, 
    borderWidth: 1, 
    borderColor: '#26f7ff' 
  },
  buttonText: { color: '#26f7ff', fontWeight: 'bold', fontSize: 12 }
});