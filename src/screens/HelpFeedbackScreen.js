import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Platform, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../utils/supabase'; // INAYOS: Isang level na lang pataas patungong src/utils
import useAuthStore from '../store/authStore'; // INAYOS: Isang level na lang pataas patungong src/store

const CATEGORIES = [
  "Admin Access issue", "Sign in issue", "Crash issue", "Function error",
  "Saving Data issue", "Adding Features", "Style/UI Updates", "Good & Friendly-use", "Other Issue"
];

const BRANCHES = [
  "Caloocan Main", "Malabon", "Malolos", "Baliwag", "Maypajo", "Navotas",
  "Bagong Barrio", "Plaridel", "Marilao", "Pulilan", "San Rafael", "Hagonoy", "Guiguinto"
];

export default function HelpFeedbackScreen({ navigation }) {
  const { userProfile } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // FORM STATES
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [username, setUsername] = useState(userProfile?.user_name || '');
  const [email, setEmail] = useState(userProfile?.email || '');

  const handleSendFeedback = async () => {
    if (!description.trim() || !username.trim() || !email.trim()) {
      if (Platform.OS === 'web') window.alert("Pansin: Pakisulat ang lahat ng kinakailangang field.");
      return;
    }

    setIsLoading(true);
    try {
      // Ise-save sa isolated feedback table para sayo lang ang read access
      const { error } = await supabase
        .from('feedback_logs') 
        .insert([{
          category,
          description,
          branch_location: branch,
          username,
          email_address: email,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setIsSuccess(true);
      setDescription('');
    } catch (err) {
      console.error("Feedback Save Error:", err.message);
      if (Platform.OS === 'web') window.alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSuccessOverlay = () => {
    setIsSuccess(false);
    setShowForm(false);
  };

  const handleBackAction = () => {
    // Kung gumagamit ng Drawer Navigation, bubuksan ang drawer, kung hindi ay babalik sa dating screen
    if (navigation && typeof navigation.toggleDrawer === 'function') {
      navigation.toggleDrawer();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* HEADER NAVIGATION TRACK BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackAction}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#26f7ff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HELP & FEEDBACK</Text>
        <View style={{ width: 60 }} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {!showForm ? (
          <View style={{ width: '100%' }}>
            {/* 1. SYSTEM USER INSTRUCTIONS CARD */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="book-open-variant" size={26} color="#26f7ff" />
                <Text style={styles.cardMainLabel}>GOSPEL TRACKER MANUAL</Text>
              </View>
              
              <View style={styles.instructionBlock}>
                <Text style={styles.stepTitle}>• Dashboard Tab</Text>
                <Text style={styles.stepDesc}>Dito makikita ang pangkalahatang buod ng iyong mga ulat. Ginagamit ito ng mga nakatatandang kapatid upang masuri kung kumpleto ang mga counter sa kasalukuyang buwan.</Text>
              </View>

              <View style={styles.instructionBlock}>
                <Text style={styles.stepTitle}>• Gospel Activity Hub</Text>
                <Text style={styles.stepDesc}>Pindutin ang bawat card (Preaching, Sermon, Prayer, atbp.) upang mag-log ng bagong data. Siguraduhing tama ang piniling schedule bago i-click ang Submit Log button.</Text>
              </View>

              <View style={styles.instructionBlock}>
                <Text style={styles.stepTitle}>• Your Profile & Identity Card</Text>
                <Text style={styles.stepDesc}>Naglalaman ng iyong Zion Identity parameters (Zion Code, LMS Level). Maaari mo ring baguhin ang iyong personal avatar at i-sync ang Notification Reminders dito.</Text>
              </View>
            </View>

            {/* 2. DEVELOPER INFO CARD */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="xml" size={26} color="#2ecc71" />
                <Text style={[styles.cardMainLabel, { color: '#2ecc71' }]}>SYSTEM ARCHITECTURE</Text>
              </View>
              <Text style={styles.devText}>Engineered by: <Text style={{ color: '#fff' }}>Gem-tech Alpha</Text></Text>
              <Text style={styles.devText}>Current Build: <Text style={{ color: '#26f7ff' }}>v2.0 (High Contrast Edition)</Text></Text>
              <Text style={styles.devText}>Core Stack: <Text style={{ color: '#fff' }}>React Native & Supabase Isolation</Text></Text>
            </View>

            {/* TOGGLE FORM BUTTON */}
            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setShowForm(true)}>
              <MaterialCommunityIcons name="message-draw" size={24} color="#000000" />
              <Text style={styles.primaryActionText}>SEND SYSTEM FEEDBACK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 3. INTERACTIVE FEEDBACK FORM MATRIX */
          <View style={{ width: '100%' }}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.formSectionTitle}>FEEDBACK FORM MATRIX</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.cancelLinkText}>Cancel Form</Text>
              </TouchableOpacity>
            </View>

            {/* CATEGORY DROPDOWN */}
            <Text style={styles.fieldLabel}>SELECT A FEEDBACK CATEGORY</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={category}
                onValueChange={(item) => setCategory(item)}
                style={styles.pickerChassis}
                dropdownIconColor="#26f7ff"
              >
                {CATEGORIES.map((cat, idx) => (
                  <Picker.Item key={idx} label={cat} value={cat} color="#0f0e0e" style={styles.pickerItemStyle} />
                ))}
              </Picker>
            </View>

            {/* ZION BRANCH DROPDOWN */}
            <Text style={styles.fieldLabel}>ZION BRANCH LOCATION</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={branch}
                onValueChange={(item) => setBranch(item)}
                style={styles.pickerChassis}
                dropdownIconColor="#26f7ff"
              >
                {BRANCHES.map((br, idx) => (
                  <Picker.Item key={idx} label={br} value={br} color="#070707" style={styles.pickerItemStyle} />
                ))}
              </Picker>
            </View>

            {/* USERNAME FIELD */}
            <Text style={styles.fieldLabel}>USERNAME</Text>
            <View style={styles.inputChassis}>
              <TextInput
                style={styles.textInputBox}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#8a8f9e"
              />
            </View>

            {/* EMAIL FIELD */}
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputChassis}>
              <TextInput
                style={styles.textInputBox}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor="#8a8f9e"
                keyboardType="email-address"
              />
            </View>

            {/* DESCRIPTION FIELD WITH 500 CHAR LIMIT */}
            <View style={styles.labelCountRow}>
              <Text style={styles.fieldLabel}>DESCRIBE YOUR FEEDBACK</Text>
              <Text style={styles.charCounter}>{description.length}/500</Text>
            </View>
            <View style={[styles.inputChassis, { minHeight: 120, alignItems: 'flex-start', paddingVertical: 8 }]}>
              <TextInput
                style={[styles.textInputBox, { textAlignVertical: 'top', height: '100%' }]}
                value={description}
                onChangeText={(txt) => description.length < 500 || txt.length < description.length ? setDescription(txt) : null}
                placeholder="Isulat dito ang detalye ng iyong feedback o isyu..."
                placeholderTextColor="#8a8f9e"
                multiline={true}
                numberOfLines={5}
              />
            </View>

            {/* SUBMIT ACTION BUTTON */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSendFeedback} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#000000" />
                  <Text style={styles.submitText}>SEND BUTTON</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* --- CINEMATIC SUCCESS HOVER OVERLAY LAYER --- */}
      {isSuccess && (
        <View style={styles.blackOverlay}>
          <View style={styles.successCardWrapper}>
            <View style={styles.greenCircleCheck}>
              <MaterialCommunityIcons name="check-bold" size={48} color="#050505" />
            </View>
            
            <Text style={styles.successGreeting}>Send Successfully</Text>
            
            <Text style={styles.successSubtitle}>
              Salamat sa iyong feedback. Titiyakin na matutugunan ito kaagad at mas ma-improve pa ang ating Gospel Tracker App. Kung para sa personal na account issue malalaman ang tugon mula sa inyong admin.
            </Text>

            <TouchableOpacity style={styles.dismissOverlayBtn} onPress={closeSuccessOverlay}>
              <Text style={styles.dismissBtnText}>God bless you! Salamat po 🙂</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#050505' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, paddingHorizontal: 15,
    backgroundColor: '#121214', borderBottomWidth: 1, borderBottomColor: '#2c303b'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backText: { color: '#26f7ff', fontSize: 16, fontWeight: '900', marginLeft: 5 },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 60 },
  glassCard: { 
    width: '100%', backgroundColor: '#121214', borderRadius: 14, 
    padding: 20, borderWidth: 1, borderColor: '#2c303b', marginBottom: 15
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardMainLabel: { color: '#26f7ff', fontSize: 14, fontWeight: '900', marginLeft: 12, letterSpacing: 1 },
  instructionBlock: { marginBottom: 14 },
  stepTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  stepDesc: { color: '#a2a8b6', fontSize: 13, lineHeight: 19, fontWeight: '500', paddingLeft: 10 },
  devText: { color: '#8a8f9e', fontSize: 13, fontWeight: '700', marginVertical: 4, letterSpacing: 0.5 },
  primaryActionBtn: {
    flexDirection: 'row', backgroundColor: '#26f7ff', width: '100%', padding: 16,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowColor: '#26f7ff', shadowOpacity: 0.2, shadowRadius: 8
  },
  primaryActionText: { color: '#000000', fontWeight: '900', fontSize: 14, marginLeft: 10, letterSpacing: 0.5 },
  formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 18 },
  formSectionTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  cancelLinkText: { color: '#ff4d4d', fontSize: 13, fontWeight: '900', textDecorationLine: 'underline' },
  fieldLabel: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 1, marginTop: 12 },
  labelCountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCounter: { color: '#8a8f9e', fontSize: 11, fontWeight: '700', marginTop: 12 },
  pickerWrap: { backgroundColor: '#121214', borderRadius: 10, borderWidth: 1, borderColor: '#2c303b', marginBottom: 6, overflow: 'hidden' },
  pickerChassis: { color: '#0b0b0b', height: 50, width: '100%' },
  pickerItemStyle: { backgroundColor: '#121214', color: '#0c0c0c' },
  inputChassis: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#121214', 
    borderRadius: 10, borderWidth: 1, borderColor: '#2c303b', paddingHorizontal: 14, height: 50, marginBottom: 6
  },
  textInputBox: { flex: 1, color: '#ffffff', fontSize: 14, fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row', backgroundColor: '#26f7ff', padding: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 24, width: '100%'
  },
  submitText: { color: '#000000', fontWeight: '900', fontSize: 14, marginLeft: 8, letterSpacing: 1 },
  blackOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#050505',
    zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: 25
  },
  successCardWrapper: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  greenCircleCheck: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#2ecc71',
    alignItems: 'center', justifyContent: 'center', marginBottom: 25,
    shadowColor: '#2ecc71', shadowOpacity: 0.4, shadowRadius: 15
  },
  successGreeting: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginBottom: 15, letterSpacing: 0.5 },
  successSubtitle: { color: '#a2a8b6', fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500', paddingHorizontal: 10 },
  dismissOverlayBtn: { backgroundColor: '#121214', borderWidth: 1, borderColor: '#2c303b', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 35 },
  dismissBtnText: { color: '#26f7ff', fontWeight: '900', fontSize: 14 }
});