import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Modal, Platform, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// --- TAMANG SUPABASE PATH BATAY SA IYONG DIRECTORY ---
import { supabase } from '../utils/supabase';

// --- DICTIONARY SYSTEM CODES AND CLASSIFICATIONS MATRIX ---
const CODE_TRANSLATION_MAP = {
  // Preaching Class
  'door to door': { class: 'Door to door Preaching', code: '101' },
  'door to door preaching': { class: 'Door to door Preaching', code: '101' },
  'street': { class: 'Street Preaching', code: '102' },
  'street preaching': { class: 'Street Preaching', code: '102' },
  'event': { class: 'Event Preaching', code: '104' },
  'event preaching': { class: 'Event Preaching', code: '104' },
  'acquaintance': { class: 'Connection Preaching', code: '105' },
  'connection': { class: 'Connection Preaching', code: '105' },
  'connection preaching': { class: 'Connection Preaching', code: '105' },
  'online': { class: 'Other Preaching', code: '118' },
  'other preaching': { class: 'Other Preaching', code: '118' },
  'preaching support': { class: 'Preaching Support', code: '123' },

  // Education Class
  'content': { class: 'Online Mission', code: '127' },
  'online mission': { class: 'Online Mission', code: '127' },
  'new member school (nms)': { class: 'Online Mission', code: '127' },
  'member i': { class: 'Online Mission', code: '127' },
  'member ii': { class: 'Online Mission', code: '127' },
  'student evangelist': { class: 'Online Mission', code: '127' },
  'evangelist i': { class: 'Online Mission', code: '127' },
  'evangelist ii': { class: 'Online Mission', code: '127' },
  'deacon(ess)': { class: 'Online Mission', code: '127' },
  'education for new member': { class: 'Education for New Member', code: '201' },
  'education for regular member': { class: 'Education for Regular Member', code: '202' },
  'education for evangelist': { class: 'Education for Evangelist', code: '203' },
  'sermon level/fms book': { class: 'Other Education', code: '207' },
  'gathering in zion': { class: 'Other Education', code: '207' },
  'prayer gathering': { class: 'Other Education', code: '207' },
  'other education': { class: 'Other Education', code: '207' },
  'visiting & study members': { class: 'Education Support', code: '212' },
  'education support': { class: 'Education Support', code: '212' },
  'other education support': { class: 'Other Education Support', code: '213' },

  // Temple Activity Class
  'cleaning in zion': { class: 'Weekly Worship Support', code: '301' },
  'cleaning zion': { class: 'Weekly Worship Support', code: '301' },
  'weekly worship': { class: 'Weekly Worship', code: '301' },
  'feast worship': { class: 'Feast Worship', code: '302' },
  'carrying children': { class: 'Temple Support', code: '211' },
  'food preparation': { class: 'Temple Support', code: '211' },
  'support': { class: 'Temple Support', code: '211' },
  'construction in zion': { class: 'Facility Management', code: '502' },
  'facility management': { class: 'Facility Management', code: '502' },
};

// Ginagamit para sa Manual entry dropdown listing selection
const MANUAL_ACTIVITIES = [
  { label: "Door to door Preaching", code: "101" },
  { label: "Street Preaching", code: "102" },
  { label: "Event Preaching", code: "104" },
  { label: "Connection Preaching", code: "105" },
  { label: "Other Preaching", code: "118" },
  { label: "Preaching Support", code: "123" },
  { label: "Online Mission", code: "127" },
  { label: "Education for New Member", code: "201" },
  { label: "Education for Regular Member", code: "202" },
  { label: "Education for Evangelist", code: "203" },
  { label: "Other Education", code: "207" },
  { label: "Education Support", code: "212" },
  { label: "Other Education Support", code: "213" },
  { label: "Weekly Worship", code: "301" },
  { label: "Feast Worship", code: "302" },
  { label: "Temple Support", code: "211" },
  { label: "Facility Management", code: "502" }
];

export default function EvangelistLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7)); // Format: YYYY-MM
  const [userCards, setUserCards] = useState([]);
  const [selectedUserCard, setSelectedUserCard] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Manual Activity Entry States
  const [manualDate, setManualDate] = useState(new Date().toISOString().substring(0, 10));
  const [manualClass, setManualClass] = useState(MANUAL_ACTIVITIES[0].label);
  const [manualCode, setManualCode] = useState(MANUAL_ACTIVITIES[0].code);

  useEffect(() => {
    fetchCentralGospelLogs();
  }, [currentMonth]);

  const fetchCentralGospelLogs = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const year = parseInt(currentMonth.split('-')[0], 10);
      const month = parseInt(currentMonth.split('-')[1], 10);
      const lastDay = new Date(year, month, 0).getDate(); 

      const startDate = `${currentMonth}-01`;
      const endDate = `${currentMonth}-${lastDay}`;

      const { data, error } = await supabase
        .from('gospel_activity')
        .select('*')
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false });

      if (error) throw error;

      const cardsAggregation = {};

      data.forEach(item => {
        // MAHIGPIT NA FIX 1: Tiyakin na trimmed at naka-normalize ang pangalan ng member para maiwasan ang dobleng card logs
        const memberName = item.full_name ? item.full_name.trim() : 'Unknown Member';
        const zionCode = item.zion_code ? item.zion_code.trim() : 'PLA';
        
        // Gagamitin natin ang eksaktong kumbinasyon ng Pangalan at Zion Code para sa buong buwan
        const uniqueKey = `${memberName.toUpperCase()}_${zionCode.toUpperCase()}`;
        
        if (!cardsAggregation[uniqueKey]) {
          cardsAggregation[uniqueKey] = {
            id: uniqueKey,
            full_name: memberName,
            zion_code: zionCode,
            age_group: item.age_group || 'Adult', 
            lms_level: item.lms_level || 'Evangelist', // Default fallback consistency check
            dailyActivities: {} 
          };
        }

        // Kung sakaling may naunang null na value sa ibang logs, punan ng tamang value kung meron sa kasalukuyang row
        if (item.age_group && cardsAggregation[uniqueKey].age_group === 'Adult') {
          cardsAggregation[uniqueKey].age_group = item.age_group;
        }
        if (item.lms_level && (cardsAggregation[uniqueKey].lms_level === 'Regular' || cardsAggregation[uniqueKey].lms_level === 'Evangelist')) {
          cardsAggregation[uniqueKey].lms_level = item.lms_level;
        }

        const dateKey = item.log_date;
        if (!cardsAggregation[uniqueKey].dailyActivities[dateKey]) {
          cardsAggregation[uniqueKey].dailyActivities[dateKey] = [];
        }

        if (cardsAggregation[uniqueKey].dailyActivities[dateKey].length < 3) {
          
          // MAHIGPIT NA FIX 2: SYSTEMATIC HIERARCHY EVALUATION ENGINE PARA SA TRANSLATION MAP
          // Inuuna ang tiyak na sub-category fields bago mag-fallback sa general classification text
          const rawEducation = item.education_type ? String(item.education_type).toLowerCase().trim() : '';
          const rawActivity = item.activity_type ? String(item.activity_type).toLowerCase().trim() : '';
          const rawPreaching = item.preaching_type ? String(item.preaching_type).toLowerCase().trim() : '';
          const rawOnline = item.online_content ? String(item.online_content).toLowerCase().trim() : '';
          const rawLms = item.lms_course ? String(item.lms_course).toLowerCase().trim() : '';

          let matchedClass = 'Other Activity Support';
          let matchedCode = '213';
          let matchFound = false;

          // Target array list para sa pagkakasunod-sunod ng may pinakamataas na prayoridad na field text value
          const prioritizedFields = [rawEducation, rawActivity, rawPreaching, rawOnline, rawLms];

          // Hanapin ang pinakaunang may tamang tugma sa ating CODE_TRANSLATION_MAP matrix array keys
          for (const currentVal of prioritizedFields) {
            if (currentVal && currentVal !== 'null' && currentVal !== 'zion') {
              // 1st Layer: Exact matching parameters
              if (CODE_TRANSLATION_MAP[currentVal]) {
                matchedClass = CODE_TRANSLATION_MAP[currentVal].class;
                matchedCode = CODE_TRANSLATION_MAP[currentVal].code;
                matchFound = true;
                break;
              }
              
              // 2nd Layer: Clean substring index search mapping keys
              const potentialKey = Object.keys(CODE_TRANSLATION_MAP).find(k => k === currentVal || currentVal.includes(k));
              if (potentialKey) {
                matchedClass = CODE_TRANSLATION_MAP[potentialKey].class;
                matchedCode = CODE_TRANSLATION_MAP[potentialKey].code;
                matchFound = true;
                break;
              }
            }
          }

          // 3rd Layer Fallback Engine Check: Kung may valid string pero walang tugma sa dictionary keys
          if (!matchFound) {
            const validFallbackText = item.education_type || item.activity_type || item.preaching_type || item.online_content || item.lms_course;
            if (validFallbackText && String(validFallbackText).toLowerCase().trim() !== 'zion') {
              matchedClass = validFallbackText;
              matchedCode = '100'; // Tracking index code for unclassified manual server injection types
            } else if (String(rawPreaching) === 'zion' || String(rawActivity).includes('cleaning')) {
              // Katulad ng nakita sa database log parameter trace file, awtomatikong ibigay ang code para sa Cleaning in Zion
              matchedClass = 'Weekly Worship Support';
              matchedCode = '301';
            }
          }

          cardsAggregation[uniqueKey].dailyActivities[dateKey].push({
            id: item.id || String(Math.random()),
            date: dateKey,
            activity_class: matchedClass,
            code: matchedCode
          });
        }
      });

      const finalCards = Object.values(cardsAggregation);
      setUserCards(finalCards);

      if (selectedUserCard) {
        const updatedCard = finalCards.find(c => c.id === selectedUserCard.id);
        if (updatedCard) setSelectedUserCard(updatedCard);
      }
    } catch (e) {
      console.error("Aggregation Pipeline Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCardDetails = (card) => {
    setSelectedUserCard(card);
    setIsModalVisible(true);
  };

  const handleAddManualActivity = async () => {
    if (!selectedUserCard) return;

    const targetDate = manualDate;
    const currentDailyLogs = selectedUserCard.dailyActivities[targetDate] || [];

    if (currentDailyLogs.length >= 3) {
      const errorMsg = "Pansin po: Maximum 3 activity table logs lamang ang pinahihintulutan kada araw.";
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert("Daily Limit Reached", errorMsg);
      return;
    }

    try {
      if (supabase) {
        const payload = {
          log_date: targetDate,
          full_name: selectedUserCard.full_name,
          zion_code: selectedUserCard.zion_code,
          activity_type: manualClass, 
          total: 1
        };

        const { error } = await supabase.from('gospel_activity').insert([payload]);
        if (error) throw error;

        await fetchCentralGospelLogs();
        
        const successMsg = "Manual entry added successfully!";
        Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("Success", successMsg);
      }
    } catch (err) {
      console.error("Manual Insert Failure:", err);
    }
  };

  const handleDeleteActivityLog = async (logId) => {
    const confirmMsg = "Sigurado ka ba na nais mong burahin ang activity record na ito?";
    
    const executeDeletion = async () => {
      try {
        if (!supabase) return;
        
        const { error } = await supabase
          .from('gospel_activity')
          .delete()
          .eq('id', logId);

        if (error) throw error;

        await fetchCentralGospelLogs();

        const successMsg = "Record deleted successfully!";
        Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("Deleted", successMsg);
      } catch (err) {
        console.error("Deletion Operation Error:", err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) executeDeletion();
    } else {
      Alert.alert(
        "Confirm Delete",
        confirmMsg,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: executeDeletion }
        ]
      );
    }
  };

  const renderDetailsTableList = () => {
    if (!selectedUserCard) return null;

    const allFlattenedLogs = [];
    // Pag-uri-urihin ang mga petsa mula sa pinakabago pababa bago ilatag sa row grid layout list
    const sortedDates = Object.keys(selectedUserCard.dailyActivities).sort((a, b) => new Date(b) - new Date(a));
    
    sortedDates.forEach(dateStr => {
      selectedUserCard.dailyActivities[dateStr].forEach(log => {
        allFlattenedLogs.push(log);
      });
    });

    return (
      <FlatList
        data={allFlattenedLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.rCell, { flex: 1 }]}>{item.date}</Text>
            <Text style={[styles.rCell, { flex: 2, color: '#ffffff', fontWeight: '500' }]}>{item.activity_class}</Text>
            <Text style={[styles.rCell, { flex: 0.8, color: '#26f7ff', fontWeight: '900', textAlign: 'center' }]}>{item.code}</Text>
            
            <View style={[styles.rCell, { flex: 0.6, alignItems: 'flex-end', justifyContent: 'center' }]}>
              <TouchableOpacity onPress={() => handleDeleteActivityLog(item.id)} style={styles.actionDeleteRowBtn} activeOpacity={0.6}>
                <MaterialCommunityIcons name="delete-outline" size={18} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyTableText}>Walang naitalang activity sa buwan na ito.</Text>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>EVANGELIST LOG ENGINE</Text>

      <Text style={styles.label}>FILTER ACTIVITY HISTORY MONTH</Text>
      <View style={styles.inputBoxWrapper}>
        {Platform.OS === 'web' ? (
          <input 
            type="month" 
            value={currentMonth} 
            onChange={(e) => setCurrentMonth(e.target.value)} 
            style={styles.webDate} 
          />
        ) : (
          <View style={styles.nativeDateContainer}>
            <TextInput 
              style={styles.inputText}
              value={currentMonth}
              placeholder="YYYY-MM"
              placeholderTextColor="#8a8f9e"
              onChangeText={setCurrentMonth}
            />
            <MaterialCommunityIcons name="calendar-multiselect" size={20} color="#26f7ff" />
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#26f7ff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={userCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userCard} onPress={() => handleOpenCardDetails(item)} activeOpacity={0.8}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardUserName}>{item.full_name}</Text>
                  <Text style={styles.cardSubDetails}>Group: {item.age_group}  |  LMS: {item.lms_level}</Text>
                </View>
                <View style={styles.badgeZion}>
                  <Text style={styles.badgeText}>{item.zion_code}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.footerActionText}>CLICK TO REVIEW TABLE LOGS</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#26f7ff" />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyTableText}>Walang nakitang Evangelist Card Logs para sa buwan na ito.</Text>
          }
        />
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>{selectedUserCard?.full_name}</Text>
                <Text style={styles.modalSubtitle}>Zion Trace Identifier: {selectedUserCard?.zion_code}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle-outline" size={28} color="#ff4d4d" />
              </TouchableOpacity>
            </View>

            <View style={styles.manualEntryBox}>
              <Text style={styles.manualSectionTitle}>ADD MANUAL ACTIVITY TRANSACTION</Text>
              
              <View style={styles.rowInput}>
                <TextInput 
                  style={[styles.inputText, styles.manualDateInput]} 
                  value={manualDate} 
                  placeholder="YYYY-MM-DD" 
                  onChangeText={setManualDate} 
                />
                
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={manualClass}
                    onValueChange={(val) => {
                      setManualClass(val);
                      const matched = MANUAL_ACTIVITIES.find(a => a.label === val);
                      if (matched) setManualCode(matched.code);
                    }}
                    style={styles.picker}
                  >
                    {MANUAL_ACTIVITIES.map((act) => (
                      <Picker.Item key={act.code} label={act.label} value={act.label} color="#050505" />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.codeRowBlock}>
                <Text style={styles.codePreviewText}>Auto System Code: <Text style={{color: '#26f7ff'}}>{manualCode}</Text></Text>
                <TouchableOpacity style={styles.addManualBtn} onPress={handleAddManualActivity}>
                  <Text style={styles.addManualBtnText}>INJECT LOG</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.tableHeaderTitle}>ACTIVITY TABLE RECORDS (MAX 3 PER DAY)</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.hCell, { flex: 1 }]}>Date</Text>
              <Text style={[styles.hCell, { flex: 2 }]}>Activity Class</Text>
              <Text style={[styles.hCell, { flex: 0.8, textAlign: 'center' }]}>Code</Text>
              <Text style={[styles.hCell, { flex: 0.6, textAlign: 'right' }]}>Action</Text>
            </View>

            <View style={{ flex: 1, marginTop: 5 }}>
              {renderDetailsTableList()}
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#050505' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 15, letterSpacing: 1.5 },
  label: { color: '#26f7ff', fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
  
  inputBoxWrapper: { marginBottom: 15 },
  nativeDateContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#121214', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c303b'
  },
  inputText: { color: '#ffffff', fontSize: 13, flex: 1 },
  webDate: { 
    backgroundColor: '#121214', color: '#26f7ff', border: '1px solid #2c303b', 
    padding: '10px', borderRadius: '8px', width: '50%', fontSize: '13px', outline: 'none' 
  },

  userCard: { 
    backgroundColor: '#121214', borderRadius: 10, padding: 14, marginBottom: 12, 
    borderWidth: 1, borderColor: '#2c303b' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardUserName: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  cardSubDetails: { color: '#8a8f9e', fontSize: 11, marginTop: 3 },
  badgeZion: { backgroundColor: '#1d222e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#26f7ff' },
  badgeText: { color: '#26f7ff', fontSize: 10, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#1c1e24', paddingTop: 8 },
  footerActionText: { color: '#26f7ff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0a0a0c', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, height: '85%', borderWidth: 1, borderColor: '#1c1e24' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  modalSubtitle: { color: '#8a8f9e', fontSize: 11, marginTop: 2 },
  
  manualEntryBox: { backgroundColor: '#121214', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#232329', marginBottom: 15 },
  manualSectionTitle: { color: '#d504e8', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  rowInput: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  manualDateInput: { backgroundColor: '#050505', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#2c303b', maxWidth: 110, color: '#ffffff', fontSize: 12, textAlign: 'center' },
  pickerWrap: { flex: 1, backgroundColor: '#050505', borderRadius: 6, borderWidth: 1, borderColor: '#2c303b', overflow: 'hidden' },
  picker: { color: '#000000', height: 40 },
  codeRowBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  codePreviewText: { color: '#8a8f9e', fontSize: 11, fontWeight: '700' },
  addManualBtn: { backgroundColor: '#d504e8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  addManualBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },

  tableHeaderTitle: { color: '#ffffff', fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#121214', padding: 10, borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#2c303b' },
  hCell: { color: '#a2a8b6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#121214', alignItems: 'center' },
  rCell: { color: '#ffffff', fontSize: 11, fontWeight: '500' },
  emptyTableText: { color: '#8a8f9e', fontSize: 11, textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
  actionDeleteRowBtn: { padding: 4, borderRadius: 4, backgroundColor: 'rgba(255, 77, 77, 0.1)' }
});