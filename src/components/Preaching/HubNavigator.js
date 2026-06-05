import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';

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
  const [preachingType, setPreachingType] = useState('Street');
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
  const [prechType, setPreachType] = useState('');
  const [tool, setTool] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState([]);

  // 5. FRUIT FORM STATES
  const [baptismDate, setBaptismDate] = useState(new Date().toISOString().split('T')[0]);
  const [fruitName, setFruitName] = useState('');
  const [fruitAge, setFruitAge] = useState('');
  const [fruitContact, setFruitContact] = useState('');
  const [fruitLogs, setFruitLogs] = useState([]);

  // --- FETCH EFFECT ---
  useEffect(() => {
    fetchCloudLogs();
  }, [activeTab]);

  const fetchCloudLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('gospel_activity')
        .select('*')
        .order('log_date', { ascending: false });

      if (error) throw error;

      const rawData = data || [];

      if (activeTab === 'Simple') {
        const filteredSimple = rawData.filter(item => {
          const b = item.breakdown || '';
          return b.includes('=') || (!b.includes('Listener:') && !b.includes('Fruit Contact:'));
        }).map(item => ({
          id: item.id,
          log_date: item.log_date,
          date: item.log_date, 
          preaching_type: item.preaching_type || 'Street',
          team: item.team || item.full_name,
          area: item.area || 'No Area',
          breakdown: item.breakdown || '',
          total: item.total || 0,
          full_name: item.full_name
        }));
        setSimpleLogs(filteredSimple);
      } 
      
      else if (activeTab === 'Connection') {
        const filteredConnection = rawData.filter(item => {
          const b = item.breakdown || '';
          return b.includes('Listener:');
        });
        setConnectionLogs(filteredConnection);
      } 
      
      else if (activeTab === 'Fruit') {
        const filteredFruit = rawData.filter(item => {
          const b = item.breakdown || '';
          return b.includes('Fruit Contact:');
        });
        setFruitLogs(filteredFruit);
      }

    } catch (err) {
      console.error("Error fetching cloud logs:", err.message);
    }
  };

  // --- COUNTER LOGIC ---
  const updateCount = (category, val) => {
    setSimpleData(prev => ({
      ...prev,
      [category]: Math.max(0, (prev[category] || 0) + val)
    }));
  };

  // --- FIELD RESET CONTROL ---
  const resetFields = () => {
    setEditId(null);
    setListener('');
    setContact('');
    setFruitName('');
    setFruitContact('');
    setPromiseDate('');
    setM2('');
    setM3('');
    setSimpleData({
      'Male Adult': 0, 'Female Adult': 0, 'Male Young Worker': 0, 'Female Young Worker': 0,
      'Male Young University': 0, 'Female Young University': 0, 'Male Senior Highschool': 0, 
      'Female Senior Highschool': 0, 'Male Middle Highschool': 0, 'Female Middle Highschool': 0,
      'Male Elementary': 0, 'Female Elementary': 0, 'Male Elderly': 0, 'Female Elderly': 0
    });
  };

  // --- ACTIONS: SUBMIT SIMPLE FORM ---
  const handleSimpleSubmit = async () => {
    if (!preachingType || preachingType.trim() === '') {
      Alert.alert("Missing Info", "Paki-pili ang tamang Preaching Type (Street, Door to door, Acquaintance, o Online).");
      return;
    }

    if (!reportedBy || !location) {
      Alert.alert("Missing Info", "Paki-pili ang Reporter name at Area/Location.");
      return;
    }
    
    setLoading(true);
    const totalCount = Object.values(simpleData).reduce((a, b) => a + b, 0);
    
    if (totalCount === 0) {
      Alert.alert("Empty Data", "Paki-pindot ang (+) icon para mag-input ng bilangan sa mga kategorya.");
      setLoading(false);
      return;
    }

    const breakdownString = Object.entries(simpleData)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => {
        const shortKey = key.split(' ').map(w => w[0]).join('');
        return `${shortKey}=${val}`;
      })
      .join(', ');

    try {
      // PURE EXACT 8 COLUMNS MATRIX ONLY
      const payload = {
        log_date: preachingDate,
        full_name: reportedBy,
        preaching_type: preachingType,
        zion_code: zionCode || 'PLA',
        team: `${reportedBy}${m1 && m1 !== reportedBy ? ', ' + m1 : ''}${m2 ? ', ' + m2 : ''}`,
        area: location,
        breakdown: breakdownString,
        total: totalCount
      };

      console.log("SENDING PURE 8-COLUMN DATA TO SUPABASE:", payload);

      let res;
      if (editId) {
        res = await supabase
          .from('gospel_activity')
          .update(payload)
          .eq('id', editId)
          .select();
      } else {
        res = await supabase
          .from('gospel_activity')
          .insert([payload])
          .select();
      }

      console.log("SUPABASE ENGINE TRANSACTION RESPONSE:", res);

      if (res.error) {
        Alert.alert("Supabase Error Caught", `Code: ${res.error.code}\nMessage: ${res.error.message}`);
        setLoading(false);
        return;
      }

      Alert.alert("Zion System", "✨ Data Secured to Cloud.");
      resetFields();
      await fetchCloudLogs();
    } catch (error) {
      Alert.alert("Database Error", error.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS: SAVE CONNECTION ---
  const handleSaveConnection = async () => {
    if (!listener || !location || !prechType) {
      Alert.alert("Missing Info", "Paki-fill up ang Preaching Type, Listener Name, at Location Area.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        log_date: dateMet,
        full_name: m1 || reportedBy,
        preaching_type: preachType,
        zion_code: zionCode || 'PLA',
        team: `${m1 || reportedBy}${m2 ? ', ' + m2 : ''}${m3 ? ', ' + m3 : ''}`,
        area: location,
        breakdown: `Listener: ${listener} | Contact: ${contact} | Type: ${inviteeType || 'None'} | Age: ${age || 'N/A'} | Status: ${isValid ? 'VALID' : 'POTENTIAL'} | Tool: ${tool || 'None'}`,
        total: 1 
      };

      let res;
      if (editId) {
        res = await supabase.from('gospel_activity').update(payload).eq('id', editId).select();
      } else {
        res = await supabase.from('gospel_activity').insert([payload]).select();
      }

      if (res.error) throw res.error;

      Alert.alert("Animo!", "Bagong Connection ay selyado na sa cloud.");
      resetFields();
      await fetchCloudLogs();
    } catch (error) {
      Alert.alert("Database Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS: SAVE FRUIT ---
  const handleSaveFruit = async () => {
    if (!fruitName || !fruitName.trim()) {
      Alert.alert("Missing Info", "Paki-fill up ang Fruit Name at Baptism Date.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        log_date: baptismDate,
        full_name: fruitName, 
        preaching_type: 'Fruit',
        zion_code: zionCode || 'PLA',
        team: `${m1 || reportedBy}${m2 ? ', ' + m2 : ''}${m3 ? ', ' + m3 : ''}`,
        area: location || 'No Area',
        breakdown: `Fruit Contact: ${fruitContact || 'None'} | Age Category: ${fruitAge || 'N/A'}`,
        total: 1
      };

      let res;
      if (editId) {
        res = await supabase.from('gospel_activity').update(payload).eq('id', editId).select();
      } else {
        res = await supabase.from('gospel_activity').insert([payload]).select();
      }

      if (res.error) throw res.error;

      Alert.alert("Many Blessing!", "Isang napakagandang bunga para sa Iyo ang na-save! 🥰");
      resetFields();
      await fetchCloudLogs();
    } catch (error) {
      Alert.alert("Database Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CLOUD LOGIC: DELETE ROW RECORD ---
  const handleCloudDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('gospel_activity')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchCloudLogs();
    } catch (error) {
      Alert.alert("Delete Error", error.message);
    }
  };

  // --- PARSE COUNTERS WHEN EDITING SIMPLE FORM ---
  const parseBreakdownToCounters = (breakdownStr) => {
    if (!breakdownStr) return;
    const baseObj = {
      'Male Adult': 0, 'Female Adult': 0, 'Male Young Worker': 0, 'Female Young Worker': 0,
      'Male Young University': 0, 'Female Young University': 0, 'Male Senior Highschool': 0, 
      'Female Senior Highschool': 0, 'Male Middle Highschool': 0, 'Female Middle Highschool': 0,
      'Male Elementary': 0, 'Female Elementary': 0, 'Male Elderly': 0, 'Female Elderly': 0
    };
    
    const keyMap = {
      'MA': 'Male Adult', 'FA': 'Female Adult', 'MYW': 'Male Young Worker', 'FYW': 'Female Young Worker',
      'MYU': 'Male Young University', 'FYU': 'Female Young University', 'MSH': 'Male Senior Highschool',
      'FSH': 'Female Senior Highschool', 'MMH': 'Male Middle Highschool', 'FMH': 'Female Middle Highschool',
      'ME': 'Male Elementary', 'FE': 'Female Elementary', 'MEld': 'Male Elderly', 'FEld': 'Female Elderly'
    };

    breakdownStr.split(', ').forEach(pair => {
      const [token, value] = pair.split('=');
      if (keyMap[token]) {
        baseObj[keyMap[token]] = parseInt(value, 10) || 0;
      }
    });
    setSimpleData(baseObj);
  };

  return (
    <View style={styles.container}>
      {/* CYBER TAB BAR */}
      <View style={styles.tabBar}>
        {['Simple', 'Connection', 'Fruit'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => { setActiveTab(tab); setEditId(null); resetFields(); }}
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
        {/* TAB 1: SIMPLE FORM — TIYAK NA NAIPASA ANG MGA TAMANG PROPS NG KUMPLETO */}
        {activeTab === 'Simple' && (
          <SimpleForm 
            preachingDate={preachingDate} 
            setPreachingDate={setPreachingDate}
            preachingType={preachingType} 
            setPreachingType={setPreachingType}
            location={location} 
            setLocation={setLocation}
            reportedBy={reportedBy} 
            setReportedBy={setReportedBy}
            partner1={m1} 
            setPartner1={setM1}
            partner2={m2} 
            setPartner2={setM2}
            simpleData={simpleData}
            updateCount={updateCount}
            handleSubmit={handleSimpleSubmit}
            handleTempSave={() => Alert.alert("Draft", "Progress recorded securely.")}
            loading={loading}
            editId={editId}
            submittedLogs={simpleLogs}
            handleEdit={(log) => {
              setEditId(log.id); 
              setPreachingDate(log.date || log.log_date); 
              setLocation(log.area || log.location);
              setPreachingType(log.preaching_type || '');
              setReportedBy(log.full_name || ''); 
              parseBreakdownToCounters(log.breakdown);
              setActiveTab('Simple');
            }}
            handleDelete={handleCloudDelete}
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
            preachType={prechType} setPreachType={setPreachType}
            tool={tool} setTool={setTool}
            isValid={isValid} setIsValid={setIsValid}
            m1={m1} setM1={setM1} m2={m2} setM2={setM2} m3={m3} setM3={setM3}
            handleSave={handleSaveConnection}
            logs={connectionLogs}
            editId={editId}
            loading={loading}
            handleEdit={(log) => {
              setEditId(log.id); setDateMet(log.log_date); setLocation(log.area || log.location);
              setM1(log.full_name); 
              setPreachType(log.preaching_type);
              
              if (log.breakdown) {
                const listenerMatch = log.breakdown.match(/Listener: (.*?)(?= \|)/);
                const contactMatch = log.breakdown.match(/Contact: (.*?)(?= \|)/);
                const typeMatch = log.breakdown.match(/Type: (.*?)(?= \||$)/);
                const ageMatch = log.breakdown.match(/Age: (.*?)(?= \||$)/);
                const toolMatch = log.breakdown.match(/Tool: (.*?)(?= \||$)/);
                const statusMatch = log.breakdown.match(/Status: (.*?)(?= \||$)/);

                if (listenerMatch) setListener(listenerMatch[1]);
                if (contactMatch) setContact(contactMatch[1]);
                if (typeMatch) setInviteeType(typeMatch[1]);
                if (ageMatch) setAge(ageMatch[1]);
                if (toolMatch) setTool(toolMatch[1]);
                if (statusMatch) setIsValid(statusMatch[1] === 'VALID');
              }
            }}
            handleDelete={handleCloudDelete}
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
            handleEdit={(log) => {
              setEditId(log.id); setBaptismDate(log.log_date); setFruitName(log.full_name);
              setLocation(log.area || log.location);
              if (log.breakdown) {
                const ageMatch = log.breakdown.match(/Age Category: (.*)/);
                const contactMatch = log.breakdown.match(/Fruit Contact: (.*?)(?= \|)/);
                if (ageMatch) setFruitAge(ageMatch[1]);
                if (contactMatch) setFruitContact(contactMatch[1]);
              }
            }}
            handleDelete={handleCloudDelete}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  tabBar: { 
    flexDirection: 'row', backgroundColor: '#18181c', padding: 6, borderRadius: 14, 
    marginHorizontal: 15, marginTop: 15, marginBottom: 20, borderWidth: 1, borderColor: '#232329',
    ...Platform.select({
      web: { boxShadow: '0px 0px 15px rgba(38, 247, 255, 0.15)' },
      default: { shadowColor: '#26f7ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 10 }
    })
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTabItem: { backgroundColor: 'rgba(38, 247, 255, 0.08)', borderWidth: 1, borderColor: '#26f7ff' },
  tabText: { color: '#b0b5c6', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  activeTabText: { color: '#26f7ff', fontWeight: '900' },
});