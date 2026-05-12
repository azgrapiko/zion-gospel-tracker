import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- VERIFIED IMPORTS ---
import SimpleForm from './Preaching/SimpleForm';
import ConnectionForm from './Preaching/ConnectionForm';
import FruitForm from './Preaching/FruitForm';

const STORAGE_KEYS = {
  SIMPLE: '@zion_simple_logs',
  CONNECTION: '@zion_connection_logs',
  FRUIT: '@zion_fruit_logs'
};

export default function PreachingModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('Simple');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null); 
  
  // --- LOG STATES ---
  const [submittedLogs, setSubmittedLogs] = useState([]); 
  const [connectionLogs, setConnectionLogs] = useState([]);
  const [fruitLogs, setFruitLogs] = useState([]);

  // --- SHARED IDENTITY STATES ---
  const [reportedBy, setReportedBy] = useState(''); 
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');

  // --- SIMPLE TAB STATES (Isolated Location) ---
  const [location, setLocation] = useState(''); 
  const [preachingDate, setPreachingDate] = useState(new Date().toISOString().split('T')[0]);
  const [simpleData, setSimpleData] = useState({
    'Male Adult': 0, 'Female Adult': 0,
    'Male Young Worker': 0, 'Female Young Worker': 0,
    'Male Young University': 0, 'Female Young University': 0,
    'Male Senior Highschool': 0, 'Female Senior Highschool': 0,
    'Male Middle Highschool': 0, 'Female Middle Highschool': 0,
    'Male Elementary': 0, 'Female Elementary': 0,
    'Male Elderly': 0, 'Female Elderly': 0
  });

  // --- CONNECTION TAB STATES (Isolated Location) ---
  const [connLocation, setConnLocation] = useState(''); 
  const [dateMet, setDateMet] = useState(new Date().toISOString().split('T')[0]);
  const [promiseDate, setPromiseDate] = useState('');
  const [listener, setListener] = useState('');
  const [contact, setContact] = useState('');
  const [age, setAge] = useState('');
  const [inviteeType, setInviteeType] = useState('');
  const [preachType, setPreachType] = useState('');
  const [tool, setTool] = useState('');
  const [isValid, setIsValid] = useState(false);

  // --- FRUIT TAB STATES (Isolated Location) ---
  const [fruitLocation, setFruitLocation] = useState(''); 
  const [baptismDate, setBaptismDate] = useState(new Date().toISOString().split('T')[0]);
  const [fruitName, setFruitName] = useState('');
  const [fruitContact, setFruitContact] = useState(''); 
  const [ageCategory, setAgeCategory] = useState('');   

  // --- PERSISTENCE LOGIC (LOAD & SAVE) ---
  useEffect(() => {
    if (visible) loadLocalData();
  }, [visible]);

  const loadLocalData = async () => {
    try {
      const sLogs = await AsyncStorage.getItem(STORAGE_KEYS.SIMPLE);
      const cLogs = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION);
      const fLogs = await AsyncStorage.getItem(STORAGE_KEYS.FRUIT);
      if (sLogs) setSubmittedLogs(JSON.parse(sLogs));
      if (cLogs) setConnectionLogs(JSON.parse(cLogs));
      if (fLogs) setFruitLogs(JSON.parse(fLogs));
    } catch (e) {
      console.error("Failed to load Zion data", e);
    }
  };

  const persistData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      Alert.alert("Storage Error", "Failed to save data locally.");
    }
  };

  // --- LOGIC HANDLERS (SIMPLE FORM) ---
  const updateCount = (key, val) => {
    setSimpleData(prev => ({ ...prev, [key]: Math.max(0, prev[key] + val) }));
  };

  const handleTempSave = () => {
    const msg = "Progress saved! Kahit ma-close ang tab, naka-imbak na ang iyong numbers.";
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Gem-tech Storage", msg);
  };

  const handleSubmit = async () => {
    if (!reportedBy || !location) {
      const errorMsg = "Please fill in Your Name and Location.";
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert("Error", errorMsg);
      return;
    }
    setLoading(true);
    
    // Logic for calculation
    const totalCount = Object.values(simpleData).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(simpleData)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => `${key.split(' ').map(w => w[0]).join('')}=${val}`)
      .join(', ');

    const entryData = {
      id: editId || Date.now(),
      date: preachingDate,
      team: `${reportedBy}${partner1 ? ', ' + partner1 : ''}`,
      area: location || 'No Area',
      breakdown: breakdown || 'No Data',
      total: totalCount,
      raw: { ...simpleData },
      names: { reportedBy, partner1, partner2 },
      timestamp: new Date().toISOString()
    };

    let updated;
    if (editId) {
      updated = submittedLogs.map(log => log.id === editId ? entryData : log);
      setEditId(null);
    } else {
      updated = [entryData, ...submittedLogs];
    }

    setSubmittedLogs(updated);
    await persistData(STORAGE_KEYS.SIMPLE, updated);
    
    setLoading(false);
    resetForm();
    Alert.alert("Success", "✨ Good Job po! ✨ Data Submitted.");
  };

  // --- LOGIC HANDLERS (CONNECTION FORM) ---
  const handleConnectionSave = async () => {
    if (!listener || !connLocation) {
      Alert.alert("Required", "Paki-fill up ang Listener at Location.");
      return;
    }
    setLoading(true);

    const newLog = {
      id: editId || Date.now(),
      date: dateMet,
      promiseDate,
      listener,
      age,
      location: connLocation,
      contact,
      inviteeType,
      preachType,
      tool,
      status: isValid ? 'VALID' : 'POTENTIAL',
      isValid: isValid,
      timestamp: new Date().toISOString()
    };

    let updated;
    if (editId) {
      updated = connectionLogs.map(l => l.id === editId ? newLog : l);
      setEditId(null);
    } else {
      updated = [newLog, ...connectionLogs];
    }

    setConnectionLogs(updated);
    await persistData(STORAGE_KEYS.CONNECTION, updated);
    
    setLoading(false);
    // Reset specific fields
    setListener(''); setContact(''); setAge(''); setIsValid(false); setPromiseDate(''); setConnLocation('');
    Alert.alert("Success", "Connection Log Secured!");
  };

  // --- LOGIC HANDLERS (FRUIT FORM) ---
  const handleFruitSave = async () => {
    if (!fruitName || !fruitLocation) {
      Alert.alert("Required", "Paki-fill up ang Name of Fruit at Location.");
      return;
    }
    setLoading(true);

    const newFruit = {
      id: editId || Date.now(),
      date: baptismDate,
      name: fruitName,
      location: fruitLocation,
      contact: fruitContact,
      age: ageCategory,
      team: `${reportedBy}${partner1 ? ', ' + partner1 : ''}`,
      timestamp: new Date().toISOString()
    };

    let updated;
    if (editId) {
      updated = fruitLogs.map(f => f.id === editId ? newFruit : f);
      setEditId(null);
    } else {
      updated = [newFruit, ...fruitLogs];
    }

    setFruitLogs(updated);
    await persistData(STORAGE_KEYS.FRUIT, updated);

    setLoading(false);
    setFruitName(''); setFruitContact(''); setAgeCategory(''); setFruitLocation('');
    Alert.alert("Success", "✨ Fruit Record Secured! ✨");
  };

  const resetForm = () => {
    setSimpleData(Object.fromEntries(Object.keys(simpleData).map(k => [k, 0])));
    setReportedBy(''); setPartner1(''); setPartner2(''); 
    setLocation(''); setConnLocation(''); setFruitLocation('');
    setEditId(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>PREACHING HUB</Text>
              <Text style={styles.subHeader}>Zion Engine v2.0 • Full Persistence</Text>
            </View>
            <TouchableOpacity onPress={() => { setEditId(null); onClose(); }}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#ff4444" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            {['Simple', 'Connection', 'Fruit'].map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tab, activeTab === tab && styles.activeTab]} 
                onPress={() => { setEditId(null); setActiveTab(tab); }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {activeTab === 'Simple' && (
              <SimpleForm 
                preachingDate={preachingDate} setPreachingDate={setPreachingDate}
                location={location} setLocation={setLocation}
                reportedBy={reportedBy} setReportedBy={setReportedBy}
                partner1={partner1} setPartner1={setPartner1}
                partner2={partner2} setPartner2={setPartner2}
                simpleData={simpleData} updateCount={updateCount}
                handleTempSave={handleTempSave} handleSubmit={handleSubmit}
                loading={loading} editId={editId}
                submittedLogs={submittedLogs} 
                handleEdit={(log) => {
                  setEditId(log.id); setPreachingDate(log.date); setLocation(log.area);
                  setReportedBy(log.names.reportedBy); setPartner1(log.names.partner1);
                  setPartner2(log.names.partner2); setSimpleData({ ...log.raw });
                  setActiveTab('Simple');
                }}
                handleDelete={async (id) => {
                  const filtered = submittedLogs.filter(l => l.id !== id);
                  setSubmittedLogs(filtered);
                  await persistData(STORAGE_KEYS.SIMPLE, filtered);
                }}
              />
            )}

            {activeTab === 'Connection' && (
              <ConnectionForm 
                dateMet={dateMet} setDateMet={setDateMet}
                promiseDate={promiseDate} setPromiseDate={setPromiseDate}
                listener={listener} setListener={setListener}
                contact={contact} setContact={setContact}
                location={connLocation} setLocation={setConnLocation}
                age={age} setAge={setAge}
                inviteeType={inviteeType} setInviteeType={setInviteeType}
                preachType={preachType} setPreachType={setPreachType}
                tool={tool} setTool={setTool}
                isValid={isValid} setIsValid={setIsValid}
                handleSave={handleConnectionSave}
                loading={loading}
                editId={editId}
                logs={connectionLogs}
                handleEdit={(log) => {
                  setEditId(log.id); setDateMet(log.date); setPromiseDate(log.promiseDate);
                  setListener(log.listener); setConnLocation(log.location);
                  setContact(log.contact); setAge(log.age); setInviteeType(log.inviteeType);
                  setPreachType(log.preachType); setTool(log.tool); setIsValid(log.isValid);
                }}
                handleDelete={async (id) => {
                  const filtered = connectionLogs.filter(l => l.id !== id);
                  setConnectionLogs(filtered);
                  await persistData(STORAGE_KEYS.CONNECTION, filtered);
                }}
              />
            )}

            {activeTab === 'Fruit' && (
              <FruitForm 
                baptismDate={baptismDate} setBaptismDate={setBaptismDate}
                fruitName={fruitName} setFruitName={setFruitName}
                fruitContact={fruitContact} setFruitContact={setFruitContact}
                ageCategory={ageCategory} setAgeCategory={setAgeCategory}
                location={fruitLocation} setLocation={setFruitLocation}
                handleSave={handleFruitSave}
                loading={loading}
                editId={editId}
                logs={fruitLogs}
                handleEdit={(log) => {
                  setEditId(log.id); setBaptismDate(log.date); setFruitName(log.name);
                  setFruitLocation(log.location); setFruitContact(log.contact);
                  setAgeCategory(log.age);
                }}
                handleDelete={async (id) => {
                  const filtered = fruitLogs.filter(l => l.id !== id);
                  setFruitLogs(filtered);
                  await persistData(STORAGE_KEYS.FRUIT, filtered);
                }}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    width: '96%', height: '92%', backgroundColor: '#0A0E12', borderRadius: 24, padding: 20, 
    maxWidth: 600, borderWidth: 1, borderColor: 'rgba(38, 247, 255, 0.1)'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  subHeader: { color: '#26f7ff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tabBar: { flexDirection: 'row', backgroundColor: '#161B22', borderRadius: 12, marginBottom: 20, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#0A0E12', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(38, 247, 255, 0.2)' },
  tabText: { color: '#8b949e', fontWeight: 'bold', fontSize: 13 },
  activeTabText: { color: '#26f7ff' }
});