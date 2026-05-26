import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { COLORS } from '../styles/theme';
import { supabase } from '../utils/supabase';
import useAuthStore from '../store/authStore'; 

export default function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  
  // Visibility States para sa Login at Registration password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

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

  // Mapping mula sa Mahabang Pangalan patungong 3-Letter Code
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

  const isFormComplete = fullName && zion && groupAge && unit && lmsLevel && usernameInput && emailAddress && password && (password === confirmPassword);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ==========================================
  // 1. TAGASALO NG RECOVERY LINK (NEW PASS PROMPT)
  // ==========================================
  useEffect(() => {
    // Makinig sa auth events ng Supabase kapag bumalik ang user mula sa email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      // Huliin kung ang event ay PASSWORD_RECOVERY
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && window.location.hash.includes('type=recovery'))) {
        if (session) {
          setLoading(true);
          
          // Sandaling delay para masiguradong tapos mag-render ang DOM sa Vercel web
          setTimeout(async () => {
            const newSecret = window.prompt("Checkpoint Verified! 🔐 Ipasok ang iyong BAGONG PASSWORD (minimum 6 characters):");
            
            if (newSecret && newSecret.trim().length >= 6) {
              const { error: updateError } = await supabase.auth.updateUser({
                password: newSecret.trim()
              });

              if (updateError) {
                showAlert("Update Failed", "Hindi na-update ang password: " + updateError.message);
              } else {
                showAlert("Success 🎉", "Matagumpay na napalitan ang iyong password! Maaari mo nang gamitin ang bagong password na ito para mag-login.");
                
                // Ligtas na i-sign out ang temporary session para makapag-login sila ng maayos
                await supabase.auth.signOut();
                window.location.hash = ""; // Linisin ang URL hash fragment
              }
            } else if (newSecret) {
              showAlert("Error", "Masyadong maikli ang bagong password na iyong inilagay. Pakisubukan muli.");
              await supabase.auth.signOut();
            } else {
              // Kung pinindot ang 'Cancel' sa prompt
              await supabase.auth.signOut();
            }
            setLoading(false);
          }, 800);
        }
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // 2. TAGAPADALA NG RECOVERY LINK (IYONG KASALUKUYANG CODE)
  // ==========================================
  const handleForgotPassword = async () => {
    if (Platform.OS === 'web') {
      const emailInput = window.prompt("Recovery System: Ipasok ang iyong Registered Active Email:");
      if (!emailInput) return;

      const cleanEmail = emailInput.trim().toLowerCase();

      if (role === 'Admin') {
        const passCheck = window.prompt("Admin Security Check: Ipasok ang Zion Passcode:");
        if (passCheck !== ADMIN_SECRET_PASSCODE) {
          showAlert("Security Denied", "Mali ang Admin Passcode.");
          return;
        }
      }

      setLoading(true);
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (searchError || !profile) {
        setLoading(false);
        showAlert("Error", "Ang email na ito ay hindi rehistrado sa ating database.");
        return;
      }

      const options = window.confirm(`Account Found!\nUser: ${profile.user_name}\n\nI-click ang OK kung PASSWORD ang gustong palitan.\nI-click ang Cancel kung USERNAME ang gustong palitan.`);
      
      if (options) {
        // Nagpapadala ng opisyal na recovery context link na babalik sa vercel deployment pipeline URL mo
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin
        });
        setLoading(false);
        if (resetError) {
          showAlert("System Error", resetError.message);
          return;
        }
        showAlert("Security Link Sent", `Ang configuration checkpoint link ay ipinadala sa ${cleanEmail}. Gamitin ito upang ma-verify ang bagong password session.`);
      } else {
        const newSetUsername = window.prompt("Ipasok ang iyong BAGONG USERNAME:");
        if (newSetUsername && newSetUsername.trim().length > 2) {
          const cleanNewUser = newSetUsername.trim().toLowerCase();
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ user_name: cleanNewUser })
            .eq('email', cleanEmail);

          if (updateError) {
            setLoading(false);
            showAlert("System Error", "Ang username na ito ay maaaring gamit na ng iba.");
          } else {
            showAlert("Success 🔐", `Ang iyong username ay matagumpay na napalitan sa "${cleanNewUser}"! Maaari mo na itong gamitin sa pag-login.`);
          }
        }
        setLoading(false);
      }
    } else {
      // Native App Recovery System Block
      Alert.alert(
        "Account Recovery Center",
        "Pumili ng nais bawiin o baguhin sa iyong account profile:",
        [
          { text: "Kanselahin", style: "cancel" },
          {
            text: "Username",
            onPress: () => {
              Alert.prompt("Username Recovery", "Ipasok ang iyong Registered Active Email:", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Suriin",
                  onPress: async (nativeEmail) => {
                    if (!nativeEmail) return;
                    setLoading(true);
                    const { data: p, error: e } = await supabase.from('profiles').select('*').eq('email', nativeEmail.trim().toLowerCase()).maybeSingle();
                    if (e || !p) { setLoading(false); showAlert("Error", "Hindi mahanap ang email."); return; }
                    
                    Alert.prompt("Bagong Username", `Account Found! Kasalukuyan: ${p.user_name}\nIpasok ang bagong username:`, [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "I-save",
                        onPress: async (newUser) => {
                          const { error: uErr } = await supabase.from('profiles').update({ user_name: newUser.trim().toLowerCase() }).eq('id', p.id);
                          setLoading(false);
                          if (uErr) showAlert("Error", "Gamit na ang username.");
                          else showAlert("Success", "Matagumpay na na-update ang username!");
                        }
                      }
                    ]);
                  }
                }
              ]);
            }
          },
          {
            text: "Password",
            onPress: () => {
              Alert.prompt("Password Reset", "Ipasok ang iyong Registered Active Email:", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Ipadala Link",
                  onPress: async (nativeEmail) => {
                    if (!nativeEmail) return;
                    setLoading(true);
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(nativeEmail.trim().toLowerCase(), {
                      redirectTo: 'ziontracker://update-password'
                    });
                    setLoading(false);
                    if (resetError) showAlert("Error", resetError.message);
                    else showAlert("Link Sent", "Suriin ang iyong email inbox para sa security verification link.");
                  }
                }
              ]);
            }
          }
        ]
      );
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
      const selectedZionCode = ZION_MAP[zion]; 

      if (!selectedZionCode) {
        setLoading(false);
        showAlert("Zion Branch Error", "Pakipili po ng tamang Zion Branch Church.");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailAddress.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            user_name: usernameInput.trim().toLowerCase(),
            role: 'member',
            zion_code: selectedZionCode, 
            is_approved: false,          
          },
        },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: authData.user.id, 
          user_name: usernameInput.trim().toLowerCase(), 
          email: emailAddress.trim().toLowerCase(), 
          full_name: fullName,
          zion_code: selectedZionCode, 
          group_age: groupAge,
          unit: unit,
          lms_level: lmsLevel,
          is_approved: false,
          role: 'member',
          tab_access: { dashboard: true, attendance: false, gospel: true, profile: true } 
        }]);

      if (profileError) throw profileError;

      setLoading(false);
      
      showAlert(
        "Successful Registered! 😊", 
        `Welcome, Kapatid na ${fullName}! Please, inform your Leader (Admin) for the approval. God bless you po! 🙇🏻‍♂️`
      );

      setIsRegistering(false);

    } catch (error) {
      setLoading(false);
      if (error.message.includes("profiles_user_name_key")) {
        showAlert("Registration Note", "Ang username na ito ay gamit na. Pakipalitan po ng iba.");
      } else if (error.message.includes("User already registered")) {
        showAlert("Registration Note", "Ang email na ito ay may account na. Subukan pong mag-login.");
      } else {
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
      else if (role.toLowerCase() === 'member' && !identifier.includes('@')) {
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

        if (profile.is_approved !== true) {
          setLoading(false);
          showAlert("Pending Approval", "Ang iyong account ay hindi pa approved ng Admin.");
          return;
        }

        loginEmail = profile.email; 
      }

      if (!loginEmail && identifier.includes('@')) {
        loginEmail = identifier.trim().toLowerCase();
      }

      const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (loginError) {
        setLoading(false);
        if (loginError.message.includes("Email not confirmed")) {
          showAlert("Email Verification", "Pakicheck ang iyong email para sa confirmation link.");
        } else {
          showAlert("Login Failed", "Mali ang Password o Credentials.");
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Hindi mahanap ang iyong Profile data.");
      }

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
            <View style={styles.passwordInputContainer}>
              <TextInput 
                placeholder="I-type dito..." 
                placeholderTextColor="#777" 
                secureTextEntry={!showPassword} 
                style={styles.passwordInputInner} 
                onChangeText={setPassword} 
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>

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

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotLinkText}>Forgot Password or Username?</Text>
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
            <View style={styles.passwordInputContainer}>
              <TextInput 
                placeholder="Password..." 
                placeholderTextColor="#777" 
                secureTextEntry={!showRegPassword} 
                style={styles.passwordInputInner} 
                onChangeText={setPassword} 
              />
              <TouchableOpacity style={styles.textEyeButton} onPress={() => setShowRegPassword(!showRegPassword)}>
                <Text style={styles.textEyeLabel}>{showRegPassword ? "HIDE" : "SHOW"}</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>CONFIRM PASSWORD:</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                placeholder="Ulitin ang Password..." 
                placeholderTextColor="#777" 
                secureTextEntry={!showRegConfirmPassword} 
                style={styles.passwordInputInner} 
                onChangeText={setConfirmPassword} 
              />
              <TouchableOpacity style={styles.textEyeButton} onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}>
                <Text style={styles.textEyeLabel}>{showRegConfirmPassword ? "HIDE" : "SHOW"}</Text>
              </TouchableOpacity>
            </View>

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
  passwordInputContainer: { flexDirection: 'row', backgroundColor: '#0D1117', borderRadius: 15, marginBottom: 22, borderWidth: 2, borderColor: '#30363D', alignItems: 'center', paddingRight: 15 },
  passwordInputInner: { flex: 1, padding: 18, color: '#FFFFFF', fontSize: 18 },
  eyeButton: { padding: 5 },
  eyeIcon: { fontSize: 20 },
  textEyeButton: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0, 255, 255, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 255, 255, 0.3)' },
  textEyeLabel: { color: '#00ffff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  adminExtraSection: { marginTop: 10, marginBottom: 15, padding: 15, backgroundColor: 'rgba(255, 85, 85, 0.1)', borderRadius: 15 },
  adminNote: { color: '#ff5555', fontSize: 12, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  adminInput: { borderColor: '#ff5555', borderWidth: 2, marginBottom: 0 },
  pickerWrapper: { backgroundColor: '#FFFFFF', borderRadius: 15, marginBottom: 22, borderWidth: 2, borderColor: '#00ffff', overflow: 'hidden', height: 60, justifyContent: 'center' },
  picker: { color: '#000000', width: '100%', height: 60, fontSize: 18 },
  btnMain: { padding: 20, borderRadius: 18, marginTop: 15, backgroundColor: '#00ffff', width: '100%', alignSelf: 'center' },
  btnText: { color: '#000', textAlign: 'center', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  forgotLinkText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 20, textDecorationLine: 'underline', fontWeight: 'bold' },
  linkText: { color: '#00ffff', fontSize: 15, textAlign: 'center', marginTop: 18, textDecorationLine: 'underline', fontWeight: '500' }
});