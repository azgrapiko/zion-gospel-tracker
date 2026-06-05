import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TAMANG SUPABASE PATH BATAY SA IYONG DIRECTORY ---
import { supabase } from '../utils/supabase';

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

  // --- SIMPLE TAB STATES ---
  const [location, setLocation] = useState(''); 
  const [preachingDate, setPreachingDate] = useState(new Date().toISOString().split('T')[0]);
  const [preachingType, setPreachingType] = useState('Street'); 
  const [simpleData, setSimpleData] = useState({
    'Male Adult': 0, 'Female Adult': 0,
    'Male Young Worker': 0, 'Female Young Worker': 0,
    'Male Young University': 0, 'Female Young University': 0,
    'Male Senior Highschool': 0, 'Female Senior Highschool': 0,
    'Male Middle Highschool': 0, 'Female Middle Highschool': 0,
    'Male Elementary': 0, 'Female Elementary': 0,
    'Male Elderly': 0, 'Female Elderly': 0
  });

  // --- CONNECTION TAB STATES ---
  const [connLocation, setConnLocation] = useState(''); 
  const [dateMet, setDateMet] = useState(new Date().toISOString().split('T')[0]);
  const [promiseDate, setPromiseDate] = useState('');
  const [listener, setListener] = useState('');
  const [contact, setContact] = useState('');
  const [age, setAge] = useState('');
  const [inviteeType, setInviteeType] = useState('');
  const [prechType, setPrechType] = useState('Street'); 
  const [tool, setTool] = useState('');
  const [isValid, setIsValid] = useState(false);
  
  // States para sa Team Members ng Connection Tab
  const [m1, setM1] = useState('');
  const [m2, setM2] = useState('');
  const [m3, setM3] = useState('');

  // --- FRUIT TAB STATES ---
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
      
      setSubmittedLogs(sLogs ? JSON.parse(sLogs) : []);
      setConnectionLogs(cLogs ? JSON.parse(cLogs) : []);
      setFruitLogs(fLogs ? JSON.parse(fLogs) : []);
    } catch (e) {
      console.error("Failed to load Zion data", e);
    }
  };

  const persistData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage write failure", e);
    }
  };

  const handleClearAllStorage = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SIMPLE);
      await AsyncStorage.removeItem(STORAGE_KEYS.CONNECTION);
      await AsyncStorage.removeItem(STORAGE_KEYS.FRUIT);
      setSubmittedLogs([]);
      setConnectionLogs([]);
      setFruitLogs([]);
      resetForm();
      const resetMsg = "Zion Cache Cleared!";
      Platform.OS === 'web' ? window.alert(resetMsg) : Alert.alert("Success", resetMsg);
    } catch (err) {
      console.error(err);
    }
  };

  // --- LOGIC HANDLERS (SIMPLE FORM) ---
  const updateCount = (key, val) => {
    setSimpleData(prev => ({ ...prev, [key]: Math.max(0, prev[key] + val) }));
  };

  const handleTempSave = () => {
    const msg = "Progress saved locally!";
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Gem-tech Storage", msg);
  };

  const handleSubmit = async () => {
    if (!reportedBy || !location) {
      const errorMsg = "Please fill in Your Name and Location.";
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert("Error", errorMsg);
      return;
    }
    setLoading(true);
    
    const totalCount = Object.values(simpleData).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(simpleData)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => `${key.split(' ').map(w => w[0]).join('')}=${val}`)
      .join(', ');

    const localId = editId || String(Date.now());

    const entryData = {
      id: localId,
      date: preachingDate,
      team: `${reportedBy}${partner1 ? ', ' + partner1 : ''}`,
      area: location || 'No Area',
      breakdown: breakdown || 'No Data',
      total: totalCount,
      raw: { ...simpleData },
      names: { reportedBy, partner1, partner2 },
      timestamp: new Date().toISOString()
    };

    try {
      if (supabase) {
        const payload = {
          log_date: preachingDate,
          full_name: reportedBy,
          preaching_type: preachingType || 'Street',
          zion_code: 'PLA',
          team: `${reportedBy}${partner1 ? ', ' + partner1 : ''}${partner2 ? ', ' + partner2 : ''}`,
          area: location || 'No Area',
          breakdown: breakdown || 'No Data',
          total: parseInt(totalCount, 10) || 0
        };

        if (editId && String(editId).includes('-')) {
          await supabase.from('gospel_activity').update(payload).eq('id', editId);
        } else {
          const res = await supabase.from('gospel_activity').insert([payload]).select();
          if (res?.data && res.data[0]) {
            entryData.id = res.data[0].id;
          }
        }
      }
    } catch (dbErr) {
      console.warn("Supabase Simple Form Error:", dbErr);
    }

    let updated = editId ? submittedLogs.map(log => log.id === editId ? entryData : log) : [entryData, ...submittedLogs];
    setSubmittedLogs(updated);
    await persistData(STORAGE_KEYS.SIMPLE, updated);
    
    setLoading(false);
    resetForm();
    Platform.OS === 'web' ? window.alert("✨ Simple Log Submitted! ✨") : Alert.alert("Success", "✨ Simple Log Submitted! ✨");
  };

  // --- LOGIC HANDLERS (CONNECTION FORM) ---
  const handleConnectionSave = async () => {
    if (!listener || !connLocation) {
      const errMsg = "Paki-fill up ang Listener at Location.";
      Platform.OS === 'web' ? window.alert(errMsg) : Alert.alert("Required", errMsg);
      return;
    }
    setLoading(true);

    const localId = editId || String(Date.now());

    const newLog = {
      id: localId,
      date: dateMet,
      promiseDate,
      listener,
      age,
      location: connLocation,
      contact,
      inviteeType,
      prechType: prechType, 
      tool,
      status: isValid ? 'VALID' : 'POTENTIAL',
      isValid: isValid,
      m1, m2, m3,
      timestamp: new Date().toISOString()
    };

    try {
      if (supabase) {
        const payload = {
          log_date: dateMet,
          full_name: listener || 'System Listener',
          zion_code: 'PLA',
          preaching_type: prechType || 'Street',
          team: `${m1 || 'System'}${m2 ? ', ' + m2 : ''}${m3 ? ', ' + m3 : ''}`,
          age: age || 'N/A',
          area: connLocation,
          connection_status: isValid ? 'VALID' : 'POTENTIAL',
          breakdown: `Contact: ${contact || 'None'} | Tool: ${tool || 'None'} | Invitee: ${inviteeType || 'None'}`,
          total: isValid ? 1 : 0 
        };

        if (editId && !String(editId).includes('-') && editId.length > 10) {
          await supabase.from('gospel_activity').insert([payload]).select();
        } else if (editId) {
          await supabase.from('gospel_activity').update(payload).eq('id', editId);
        } else {
          const res = await supabase.from('gospel_activity').insert([payload]).select();
          if (res?.data && res.data[0]) {
            newLog.id = res.data[0].id;
          }
        }
      }
    } catch (dbErr) {
      console.warn("Supabase Connection Error:", dbErr);
    }

    let updated = editId ? connectionLogs.map(l => l.id === editId ? newLog : l) : [newLog, ...connectionLogs];
    setConnectionLogs(updated);
    await persistData(STORAGE_KEYS.CONNECTION, updated);
    
    setLoading(false);
    setListener(''); setContact(''); setAge(''); setIsValid(false); setPromiseDate(''); setConnLocation(''); setM1(''); setM2(''); setM3('');
    Platform.OS === 'web' ? window.alert("Connection Log Secured!") : Alert.alert("Success", "Connection Log Secured!");
  };

  // --- LOGIC HANDLERS (FRUIT FORM) ---
  const handleFruitSave = async () => {
    if (!fruitName || !fruitLocation) {
      const errMsg = "Paki-fill up ang Name of Fruit at Location.";
      Platform.OS === 'web' ? window.alert(errMsg) : Alert.alert("Required", errMsg);
      return;
    }
    setLoading(true);

    const localId = editId || String(Date.now());

    const newFruit = {
      id: localId,
      date: baptismDate,
      name: fruitName,
      location: fruitLocation,
      contact: fruitContact,
      age: ageCategory,
      team: `${reportedBy}${partner1 ? ', ' + partner1 : ''}`,
      timestamp: new Date().toISOString()
    };

    try {
      if (supabase) {
        const payload = {
          log_date: baptismDate,
          full_name: fruitName,
          preaching_type: 'Fruit',
          zion_code: 'PLA',
          team: `${reportedBy || 'System'}${partner1 ? ', ' + partner1 : ''}`,
          area: fruitLocation,
          breakdown: `Fruit Contact: ${fruitContact || 'None'} | Age Category: ${ageCategory || 'N/A'}`,
          total: 1
        };

        if (editId && String(editId).includes('-')) {
          await supabase.from('gospel_activity').update(payload).eq('id', editId);
        } else {
          const res = await supabase.from('gospel_activity').insert([payload]).select();
          if (res?.data && res.data[0]) {
            newFruit.id = res.data[0].id;
          }
        }
      }
    } catch (dbErr) {
      console.warn("Supabase Fruit Error:", dbErr);
    }

    let updated = editId ? fruitLogs.map(f => f.id === editId ? newFruit : f) : [newFruit, ...fruitLogs];
    setFruitLogs(updated);
    await persistData(STORAGE_KEYS.FRUIT, updated);

    setLoading(false);
    setFruitName(''); setFruitContact(''); setAgeCategory(''); setFruitLocation('');
    Platform.OS === 'web' ? window.alert("✨ Fruit Record Secured! ✨") : Alert.alert("Success", "✨ Fruit Record Secured! ✨");
  };

  const resetForm = () => {
    setSimpleData(Object.fromEntries(Object.keys(simpleData).map(k => [k, 0])));
    setReportedBy(''); setPartner1(''); setPartner2(''); 
    setLocation(''); setConnLocation(''); setFruitLocation('');
    setM1(''); setM2(''); setM3('');
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={handleClearAllStorage}>
                <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ffb700" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditId(null); onClose(); }}>
                <MaterialCommunityIcons name="close-circle" size={32} color="#ff4444" />
              </TouchableOpacity>
            </View>
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
                preachingType={preachingType} setPreachingType={setPreachingType} 
                location={location} setLocation={setLocation}
                reportedBy={reportedBy} setReportedBy={setReportedBy}
                partner1={partner1} setPartner1={setPartner1}
                partner2={partner2} setPartner2={setPartner2}
                simpleData={simpleData} updateCount={updateCount}
                handleTempSave={handleTempSave} handleSubmit={handleSubmit}
                loading={loading} editId={editId}
                submittedLogs={submittedLogs || []} 
                handleEdit={(log) => {
                  if(!log) return;
                  setEditId(log.id); setPreachingDate(log.date || ''); setLocation(log.area || '');
                  setReportedBy(log.names?.reportedBy || ''); setPartner1(log.names?.partner1 || '');
                  setPartner2(log.names?.partner2 || ''); setSimpleData({ ...(log.raw || {}) });
                  setActiveTab('Simple');
                }}
                handleDelete={async (id) => {
                  try {
                    if (supabase) await supabase.from('gospel_activity').delete().eq('id', id);
                  } catch(e){}
                  const filtered = (submittedLogs || []).filter(l => l.id !== id);
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
                prechType={prechType} setPreachType={setPrechType} 
                tool={tool} setTool={setTool}
                isValid={isValid} setIsValid={setIsValid}
                m1={m1} setM1={setM1}
                m2={m2} setM2={setM2}
                m3={m3} setM3={setM3} 
                handleSave={handleConnectionSave}
                loading={loading}
                editId={editId}
                logs={connectionLogs || []}
                handleEdit={(log) => {
                  if(!log) return;
                  setEditId(log.id); setDateMet(log.date || ''); setPromiseDate(log.promiseDate || '');
                  setListener(log.listener || ''); setConnLocation(log.location || '');
                  setContact(log.contact || ''); setAge(log.age || ''); setInviteeType(log.inviteeType || '');
                  setPrechType(log.prechType || log.preachingType || 'Street'); setTool(log.tool || ''); 
                  setIsValid(log.isValid || log.status === 'VALID');
                  setM1(log.m1 || ''); setM2(log.m2 || ''); setM3(log.m3 || '');
                }}
                handleDelete={async (id) => {
                  try {
                    if (supabase) await supabase.from('gospel_activity').delete().eq('id', id);
                  } catch(e){}
                  const filtered = (connectionLogs || []).filter(l => l.id !== id);
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
                logs={fruitLogs || []}
                handleEdit={(log) => {
                  if(!log) return;
                  setEditId(log.id); setBaptismDate(log.date || ''); setFruitName(log.name || '');
                  setFruitLocation(log.location || ''); setFruitContact(log.contact || '');
                  setAgeCategory(log.age || '');
                }}
                handleDelete={async (id) => {
                  try {
                    if (supabase) await supabase.from('gospel_activity').delete().eq('id', id);
                  } catch(e){}
                  const filtered = (fruitLogs || []).filter(l => l.id !== id);
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 5, 5, 0.94)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '96%', height: '92%', backgroundColor: '#121214', borderRadius: 24, padding: 20, maxWidth: 600, borderWidth: 1, borderColor: '#232329' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  subHeader: { color: '#26f7ff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },
  tabBar: { flexDirection: 'row', backgroundColor: '#18181c', borderRadius: 14, marginBottom: 20, padding: 5, borderWidth: 1, borderColor: '#232329' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#121214', borderRadius: 10, borderWidth: 1, borderColor: '#26f7ff' },
  tabText: { color: '#d1d4dc', fontWeight: '900', fontSize: 13, letterSpacing: 0.3 },
  activeTabText: { color: '#26f7ff', fontWeight: '900' }
});