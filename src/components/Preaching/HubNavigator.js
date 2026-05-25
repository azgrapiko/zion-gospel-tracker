import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';

// PATHS: Utils at Store
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../store/authStore';

// Ang ating Trilogy of Forms
import SimpleForm from './SimpleForm';
import ConnectionForm from './ConnectionForm';
import FruitForm from './FruitForm';

export default function HubNavigator() {
  const { userProfile, zionCode } = useAuthStore();
  
  // 1. NAVIGATION & GLOBAL LOADING
  const [activeTab, setActiveTab] = useState('Simple');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // 2. SHARED IDENTITY & LOCATION (Sync sa lahat ng tabs)
  const [location, setLocation] = useState('');
  const [reportedBy, setReportedBy] = useState(userProfile?.full_name || ''); 
  const [m1, setM1] = useState(userProfile?.full_name || ''); 
  const [m2, setM2] = useState('');
  const [m3, setM3] = useState('');

  // 3. SIMPLE FORM STATES
  const [preachingDate, setPreachingDate] = useState(new Date().toISOString().split('T')[0]);
  const [simpleData, setSimpleData] = useState({
    'Male Adult': 0, 'Female Adult': 0, 'Male Young Worker': 0, 'Female Young Worker': 0,
    'Male Young University': 0, 'Female Young University': 0, 'Male Senior Highschool': 0, 
    'Female Senior Highschool': 0, 'Male Middle Highschool': 0, 'Female Middle Highschool': 0,
    'Male Elementary': 0, 'Female Elementary': 0, 'Male Elderly': 0, 'Female Elderly': 0
  });
  const [simpleLogs, setSimpleLogs] = useState([]);

  // 4. CONNECTION FORM STATES
  const [dateMet, setDateMet] = useState(new Date().toISOString().split('T')[0]);
  const [promiseDate, setPromiseDate] = useState('');
  const [listener, setListener] = useState('');
  const [contact, setContact] = useState('');
  const [age, setAge] = useState('');
  const [inviteeType, setInviteeType] = useState('');
  const [preachType, setPreachType] = useState('');
  const [tool, setTool] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState([]);

  // 5. FRUIT FORM STATES
  const [baptismDate, setBaptismDate] = useState(new Date().toISOString().split('T')[0]);
  const [fruitName, setFruitName] = useState('');
  const [fruitAge, setFruitAge] = useState('');
  const [fruitContact, setFruitContact] = useState('');
  const [fruitLogs, setFruitLogs] = useState([]);

  // --- LOGIC: COUNTER FOR SIMPLE FORM ---
  const updateCount = (category, val) => {
    setSimpleData(prev => ({
      ...prev,
      [category]: Math.max(0, (prev[category] || 0) + val)
    }));
  };

  // --- ACTIONS: RESET FIELDS AFTER SAVE ---
  const resetFields = () => {
    setEditId(null);
    setListener('');
    setContact('');
    setFruitName('');
    setFruitContact('');
    setPromiseDate('');
  };

  // --- LOGIC: SUBMIT SIMPLE FORM ---
  const handleSimpleSubmit = async () => {
    // FIXED: Tiyaking reportedBy at location ang chine-check dito
    if (!reportedBy || !location) {
      Alert.alert("Missing Info", "Paki-lagay ang iyong Pangalan (Reporter) at Location.");
      return;
    }
    
    setLoading(true);
    // Dito ilalagay ang Supabase logic para sa Simple Preaching
    console.log("Simple Data Submitting...", { simpleData, location, reportedBy });
    
    setTimeout(() => {
        setLoading(false);
        Alert.alert("Zion System", "Simple Preaching Data Recorded!");
    }, 1500);
  };

  // --- LOGIC: SAVE CONNECTION ---
  const handleSaveConnection = async () => {
    // FIXED: Validation para sa Connection tab lamang
    if (!listener || !location || !m1) {
      Alert.alert("Missing Info", "Paki-fill up ang Listener Name, Location, at Member 1.");
      return;
    }
    setLoading(true);
    console.log("Saving Connection...", { listener, dateMet, isValid });
    
    setTimeout(() => {
        setLoading(false);
        resetFields();
        Alert.alert("Animo!", "Bagong Connection ay na-save na.");
    }, 1500);
  };

  // --- LOGIC: SAVE FRUIT ---
  const handleSaveFruit = async () => {
    if (!fruitName || !m1 || !baptismDate) {
      Alert.alert("Missing Info", "Paki-fill up ang Fruit Name at Baptism Date.");
      return;
    }
    setLoading(true);
    console.log("Saving Fruit...", { fruitName, baptismDate });
    
    setTimeout(() => {
        setLoading(false);
        resetFields();
        Alert.alert("Praise the Lord!", "Isang napakagandang bunga para sa Zion! 🥰");
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* CYBER TAB BAR */}
      <View style={styles.tabBar}>
        {['Simple', 'Connection', 'Fruit'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => { setActiveTab(tab); setEditId(null); }}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 30 }}
      >
        {/* TAB 1: SIMPLE FORM */}
        {activeTab === 'Simple' && (
          <SimpleForm 
            preachingDate={preachingDate} setPreachingDate={setPreachingDate}
            location={location} setLocation={setLocation}
            reportedBy={reportedBy} setReportedBy={setReportedBy}
            partner1={m1} setPartner1={setM1}
            partner2={m2} setPartner2={setM2}
            simpleData={simpleData}
            updateCount={updateCount}
            handleSubmit={handleSimpleSubmit}
            handleTempSave={() => Alert.alert("Draft", "Data saved locally.")}
            loading={loading}
            editId={editId}
            submittedLogs={simpleLogs}
          />
        )}

        {/* TAB 2: CONNECTION FORM */}
        {activeTab === 'Connection' && (
          <ConnectionForm 
            dateMet={dateMet} setDateMet={setDateMet}
            promiseDate={promiseDate} setPromiseDate={setPromiseDate}
            listener={listener} setListener={setListener}
            contact={contact} setContact={setContact}
            location={location} setLocation={setLocation}
            age={age} setAge={setAge}
            inviteeType={inviteeType} setInviteeType={setInviteeType}
            preachType={preachType} setPreachType={setPreachType}
            tool={tool} setTool={setTool}
            isValid={isValid} setIsValid={setIsValid}
            m1={m1} setM1={setM1} m2={m2} setM2={setM2} m3={m3} setM3={setM3}
            handleSave={handleSaveConnection}
            logs={connectionLogs}
            editId={editId}
            loading={loading}
          />
        )}

        {/* TAB 3: FRUIT FORM */}
        {activeTab === 'Fruit' && (
          <FruitForm 
            baptismDate={baptismDate} setBaptismDate={setBaptismDate}
            fruitName={fruitName} setFruitName={setFruitName}
            location={location} setLocation={setLocation}
            contact={fruitContact} setContact={setFruitContact}
            ageCategory={fruitAge} setAgeCategory={setFruitAge}
            m1={m1} setM1={setM1} m2={m2} setM2={setM2} m3={m3} setM3={setM3}
            handleSave={handleSaveFruit}
            logs={fruitLogs}
            editId={editId}
            loading={loading}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#050505' // Pitch black para sa maximum clear-separation base ng core layouts
  },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#18181c', // Inilapat mula #111 para sa premium material contrast reflection
    padding: 6, 
    borderRadius: 14, 
    marginHorizontal: 15, 
    marginTop: 15,
    marginBottom: 20,
    borderWidth: 1, 
    borderColor: '#232329', // Mas litaw na framing lines kaysa sa dating madilim na #222
    ...Platform.select({
      web: { boxShadow: '0px 0px 15px rgba(38, 247, 255, 0.15)' },
      default: {
        shadowColor: '#26f7ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      }
    })
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTabItem: { 
    backgroundColor: 'rgba(38, 247, 255, 0.08)', 
    borderWidth: 1, 
    borderColor: '#26f7ff' 
  },
  tabText: { 
    color: '#b0b5c6', // Ginitna sa solid gray-silver mula #555 para mabilis mabasa ng adults kung alin ang un-selected tabs
    fontSize: 11,     // Itinaas mula 10 para sa text size visibility enhancement
    fontWeight: '900', 
    letterSpacing: 1 
  },
  activeTabText: { 
    color: '#26f7ff',
    fontWeight: '900'
  },
});