import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { COLORS } from '../styles/theme';
import { supabase } from '../utils/supabase';
import useAuthStore from '../store/authStore'; // 1. In-import ang store nang walang { }

export default function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);

  // Zustand Store Action
  const { setAuth } = useAuthStore();

 // --- ADMIN CONFIG ---
  const ADMIN_SECRET_PASSCODE = "Zion1948"; 
  const ADMIN_EMAIL_DOMAIN = "@zion.com"; 

  const zionBranches = [
    "Caloocan Main", "Malabon", "Malolos", "Baliuag", "Navotas", 
    "Maypajo", "Bagong Barrio", "Marilao", "Plaridel", "Pandi", 
    "Pulilan", "Guiguinto", "San Rafael", "Hagonoy"
  ];

  // 1. Mapping mula sa Mahabang Pangalan patungong 3-Letter Code
  const ZION_MAP = {
    "Caloocan Main": "CAL",
    "Malabon": "MLB",
    "Malolos": "MLS",
    "Baliuag": "BAL",
    "Navotas": "NAV",
    "Maypajo": "MAY",
    "Bagong Barrio": "BGB",
    "Marilao": "MAR",
    "Plaridel": "PLA",
    "Pandi": "PAN",
    "Pulilan": "PUL",
    "Guiguinto": "GUI",
    "San Rafael": "SRA",
    "Hagonoy": "HAG"
  };

  // Form States
  const [fullName, setFullName] = useState('');
  const [zion, setZion] = useState(''); 
  const [groupAge, setGroupAge] = useState(''); 
  const [unit, setUnit] = useState(''); 
  const [lmsLevel, setLmsLevel] = useState('');
  const [usernameInput, setUsernameInput] = useState(''); 
  const [emailAddress, setEmailAddress] = useState('');   
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');

  // 2. Tiyaking 'zion' state ang chinecheck dito
  const isFormComplete = fullName && zion && groupAge && unit && lmsLevel && usernameInput && emailAddress && password && (password === confirmPassword);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // --- REGISTRATION LOGIC ---
  const handleRegister = async () => {
    if (role === 'Admin') {
      showAlert("Exclusive", "Admin registration is handled by the Founder.");
      return;
    }

    if (!isFormComplete) {
      showAlert("Input Error", "Pakisagot po ang lahat ng fields, Kapatid.");
      return;
    }

    setLoading(true);

    try {
      // 1. MAPPING LOGIC (Dapat nasa itaas ito ng signUp)
const selectedZionCode = ZION_MAP[zion]; 

if (!selectedZionCode) {
  setLoading(false);
  showAlert("Zion Branch Error", "Pakipili po ng tamang Zion Branch Church.");
  return;
}

// 2. SUPABASE AUTH SIGNUP (Updated with zion_code)
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: emailAddress.trim().toLowerCase(),
  password: password,
  options: {
    data: {
      full_name: fullName,
      user_name: usernameInput.trim().toLowerCase(),
      role: 'member',
      zion_code: selectedZionCode, // <--- NAPAKAHALAGA: Dito kukuha ang trigger
      is_approved: false,          // Default state para sa Admin Approval
    },
  },
});

if (authError) throw authError;

// 3. INSERT SA PROFILES TABLE (Kasama ang lahat ng fields)
const { error: profileError } = await supabase
  .from('profiles')
  .insert([{ 
    id: authData.user.id, 
    user_name: usernameInput.trim().toLowerCase(), 
    email: emailAddress.trim().toLowerCase(), 
    full_name: fullName,
    zion_code: selectedZionCode, // Tiyak na may laman (PLA, CAL, etc.)
    group_age: groupAge,
    unit: unit,
    lms_level: lmsLevel,
    is_approved: false,
    role: 'member',
    tab_access: { dashboard: true, attendance: false, gospel: true, profile: true } 
  }]);

if (profileError) throw profileError;

      setLoading(false);
      
      // 4. SUCCESS ALERT
      showAlert(
        "Successful Registered! 😊", 
        `Welcome, Kapatid na ${fullName}! Please, inform your Leader (Admin) for the approval. God bless you po! 🙇🏻‍♂️`
      );

      setIsRegistering(false);

    } catch (error) {
      setLoading(false);
      
      // 5. SMART ERROR HANDLING
      if (error.message.includes("profiles_user_name_key")) {
        showAlert("Registration Note", "Ang username na ito ay gamit na. Pakipalitan po ng iba.");
      } else if (error.message.includes("User already registered")) {
        showAlert("Registration Note", "Ang email na ito ay may account na. Subukan pong mag-login.");
      } else {
        // Updated as per your request
        showAlert("Makipag-ugnayan sa iyong Leader (Admin)", error.message);
      }
    }
  };

// --- LOGIN LOGIC ---
const handleLogin = async () => {
  if (!usernameInput || !password) {
    showAlert("Incomplete", "Pakilagay po ang iyong Username at Password.");
    return;
  }

  setLoading(true);
  const identifier = usernameInput.trim();
  let loginEmail = identifier;

  try {
    // 1. ADMIN LOGIC
    if (role === 'Admin') {
      if (adminPasscode !== ADMIN_SECRET_PASSCODE) {
        setLoading(false);
        showAlert("Security Denied", "Mali ang Admin Passcode.");
        return;
      }
      
      if (!identifier.includes('@')) {
        loginEmail = `${identifier.toLowerCase()}${ADMIN_EMAIL_DOMAIN}`;
      } else {
        loginEmail = identifier.toLowerCase();
      }
    }
    // 2. MEMBER LOGIC (Pinatibay na check para sa Multi-Tenancy)
    else if (role.toLowerCase() === 'member' && !identifier.includes('@')) {
      // Gamit ang .trim().toLowerCase() para iwas error sa extra spaces o casing
      const cleanIdentifier = identifier.trim().toLowerCase();

      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('email, is_approved')
        .eq('user_name', cleanIdentifier)
        .maybeSingle();

      if (searchError) throw new Error("Database issue: " + searchError.message);
      
      if (!profile) {
        setLoading(false);
        showAlert("Login Failed", `Ang username na "${identifier}" ay hindi rehistrado.`);
        return;
      }

      // Double check kung approved na sa Zion Control Center
      if (profile.is_approved !== true) {
        setLoading(false);
        showAlert("Pending Approval", "Ang iyong account ay hindi pa approved ng Admin.");
        return;
      }

      loginEmail = profile.email; // Dito nakuha ang email para sa Auth step
    }

    // 3. EXECUTE AUTH (Siguraduhing may loginEmail kung Email ang ininput)
    if (!loginEmail && identifier.includes('@')) {
      loginEmail = identifier.trim().toLowerCase();
    }

    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (loginError) {
      setLoading(false);
      // Mas specific na error handling base sa Supabase Auth response
      if (loginError.message.includes("Email not confirmed")) {
        showAlert("Email Verification", "Pakicheck ang iyong email para sa confirmation link.");
      } else {
        showAlert("Login Failed", "Mali ang Password o Credentials.");
      }
      return;
    }

    // 4. SYNC TO ZUSTAND: Kunin ang buong profile pati tab_access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Hindi mahanap ang iyong Profile data.");
    }

    // I-set ang store (Zustand) bago mag-onLogin para sa RBAC navigation
    if (profile) {
      setAuth({ ...profile, user }); 
    }

    setLoading(false);
    if (onLogin) onLogin();

  } catch (err) {
    setLoading(false);
    showAlert("System Error", err.message);
  }
};
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>GOSPEL ACTIVITY TRACKER</Text>
      <Text style={styles.greetings}>God bless you po, Kapatid!</Text>

      <View style={styles.roleSwitcher}>
        <TouchableOpacity onPress={() => { setRole('Admin'); setIsRegistering(false); }}>
          <Text style={[styles.roleLabel, role === 'Admin' && styles.activeRole]}>Admin (Exclusive)</Text>
        </TouchableOpacity>
        <Text style={{ color: '#555' }}> | </Text>
        <TouchableOpacity onPress={() => setRole('Member')}>
          <Text style={[styles.roleLabel, role === 'Member' && styles.activeRole]}>Member (Create Account)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS?.primary || '#00ffff'} style={{ padding: 40 }} />
        ) : !isRegistering ? (
          /* --- LOGIN FORM --- */
          <View>
            <Text style={styles.label}>{role === 'Admin' ? "ADMIN ID:" : "USERNAME / EMAIL:"}</Text>
            <TextInput 
              placeholder="I-type dito..." 
              placeholderTextColor="#777" 
              style={styles.input} 
              onChangeText={setUsernameInput} 
              autoCapitalize="none" 
            />
            <Text style={styles.label}>PASSWORD:</Text>
            <TextInput 
              placeholder="I-type dito..." 
              placeholderTextColor="#777" 
              secureTextEntry 
              style={styles.input} 
              onChangeText={setPassword} 
            />

            {role === 'Admin' && (
              <View style={styles.adminExtraSection}>
                <Text style={styles.adminNote}>Admin Verification Required:</Text>
                <TextInput 
                  placeholder="Enter Zion Passcode" 
                  placeholderTextColor="#ff5555" 
                  secureTextEntry 
                  style={[styles.input, styles.adminInput]} 
                  onChangeText={setAdminPasscode} 
                />
              </View>
            )}

            <TouchableOpacity style={styles.btnMain} onPress={handleLogin}>
              <Text style={styles.btnText}>PUMASOK (LOGIN)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(true)}>
              <Text style={styles.linkText}>Wala pang account? Register dito.</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* --- REGISTRATION FORM --- */
          <View>
            <Text style={styles.formTitle}>Member Registration</Text>
            <Text style={styles.label}>FULL NAME:</Text>
            <TextInput placeholder="I-type ang Pangalan..." placeholderTextColor="#777" style={styles.input} onChangeText={setFullName} />
            
            <Text style={styles.label}>ZION (BRANCH CHURCH):</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={zion} onValueChange={(v) => setZion(v)} style={styles.picker} dropdownIconColor="#000">
                <Picker.Item label="-- Pumili ng Branch --" value="" color="#888" />
                {zionBranches.map(b => <Picker.Item key={b} label={b} value={b} color="#000" />)}
              </Picker>
            </View>

            <Text style={styles.label}>GROUP AGE:</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={groupAge} onValueChange={(v) => setGroupAge(v)} style={styles.picker} dropdownIconColor="#000">
                <Picker.Item label="-- Pumili ng Grupo --" value="" color="#888" />
                <Picker.Item label="Male Adult" value="Male Adult" color="#000" />
                <Picker.Item label="Female Adult" value="Female Adult" color="#000" />
                <Picker.Item label="Male Young" value="Male Young" color="#000" />
                <Picker.Item label="Female Young" value="Female Young" color="#000" />
                <Picker.Item label="Male SHS" value="Male SHS" color="#000" />
                <Picker.Item label="Female SHS" value="Female SHS" color="#000" />
                <Picker.Item label="Male MHS" value="Male MHS" color="#000" />
                <Picker.Item label="Female MHS" value="Female MHS" color="#000" />
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={[styles.pickerWrapper, { width: '48%' }]}>
                  <Picker selectedValue={unit} onValueChange={(v) => setUnit(v)} style={styles.picker} dropdownIconColor="#000">
                    <Picker.Item label="Unit" value="" color="#888" />
                    {[1,2,3,4,5,6,7,8,9,10].map(u => <Picker.Item key={u} label={`${u}`} value={`${u}`} color="#000" />)}
                  </Picker>
                </View>
                <View style={[styles.pickerWrapper, { width: '48%' }]}>
                  <Picker selectedValue={lmsLevel} onValueChange={(v) => setLmsLevel(v)} style={styles.picker} dropdownIconColor="#000">
                    <Picker.Item label="LMS" value="" color="#888" />
                    <Picker.Item label="New Member" value="New Member" color="#000" />
                    <Picker.Item label="Member 1" value="Member 1" color="#000" />
                    <Picker.Item label="Member 2" value="Member 2" color="#000" />
                    <Picker.Item label="Evangelist" value="Evangelist" color="#000" />
                    <Picker.Item label="Deacon(ess)" value="Deacon(ess)" color="#000" />
                    <Picker.Item label="Missionary" value="Missionary" color="#000" />
                  </Picker>
                </View>
            </View>

            <Text style={styles.label}>CREATE USERNAME:</Text>
            <TextInput placeholder="Username..." placeholderTextColor="#777" style={styles.input} onChangeText={setUsernameInput} autoCapitalize="none" />
            
            <Text style={styles.label}>ACTIVE EMAIL:</Text>
            <TextInput placeholder="Email Address..." placeholderTextColor="#777" style={styles.input} onChangeText={setEmailAddress} autoCapitalize="none" keyboardType="email-address" />
            
            <Text style={styles.label}>PASSWORD:</Text>
            <TextInput placeholder="Password..." placeholderTextColor="#777" secureTextEntry style={styles.input} onChangeText={setPassword} />
            
            <Text style={styles.label}>CONFIRM PASSWORD:</Text>
            <TextInput placeholder="Ulitin ang Password..." placeholderTextColor="#777" secureTextEntry style={styles.input} onChangeText={setConfirmPassword} />

            <TouchableOpacity 
              style={[styles.btnMain, { backgroundColor: isFormComplete ? '#2ecc71' : '#444', marginTop: 25 }]} 
              onPress={handleRegister}
            >
              <Text style={[styles.btnText, { color: isFormComplete ? '#000' : '#888' }]}>TAPOS NA (REGISTER)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(false)}>
              <Text style={styles.linkText}>May account na? Balik sa Login.</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0A0E12', alignItems: 'center', paddingVertical: 50 },
  title: { fontSize: 14, color: '#00ffff', fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  greetings: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 30, textAlign: 'center' },
  roleSwitcher: { flexDirection: 'row', marginBottom: 30, alignItems: 'center', backgroundColor: '#161B22', padding: 10, borderRadius: 20 },
  roleLabel: { color: '#777', marginHorizontal: 15, fontSize: 16 },
  activeRole: { color: '#00ffff', fontWeight: 'bold', borderBottomWidth: 3, borderBottomColor: '#00ffff', paddingBottom: 4 },
  card: { width: '95%', maxWidth: 480, backgroundColor: '#161B22', borderRadius: 25, padding: 30, borderWidth: 2, borderColor: 'rgba(0, 255, 255, 0.3)', elevation: 20 },
  formTitle: { color: '#00ffff', fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  label: { color: '#00ffff', fontSize: 14, marginBottom: 8, marginLeft: 5, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#0D1117', borderRadius: 15, padding: 18, color: '#FFFFFF', marginBottom: 22, borderWidth: 2, borderColor: '#30363D', fontSize: 18 },
  adminExtraSection: { marginTop: 10, marginBottom: 15, padding: 15, backgroundColor: 'rgba(255, 85, 85, 0.1)', borderRadius: 15 },
  adminNote: { color: '#ff5555', fontSize: 12, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  adminInput: { borderColor: '#ff5555', borderWidth: 2, marginBottom: 0 },
  pickerWrapper: { backgroundColor: '#FFFFFF', borderRadius: 15, marginBottom: 22, borderWidth: 2, borderColor: '#00ffff', overflow: 'hidden', height: 60, justifyContent: 'center' },
  picker: { color: '#000000', width: '100%', height: 60, fontSize: 18 },
  btnMain: { padding: 20, borderRadius: 18, marginTop: 15, backgroundColor: '#00ffff', width: '100%', alignSelf: 'center' },
  btnText: { color: '#000', textAlign: 'center', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  linkText: { color: '#00ffff', fontSize: 15, textAlign: 'center', marginTop: 25, textDecorationLine: 'underline', fontWeight: '500' }
});