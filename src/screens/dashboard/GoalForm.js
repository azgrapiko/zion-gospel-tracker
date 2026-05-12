import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const COLORS = {
  primary: '#26f7ff',
  background: '#050505',
  card: '#111',
  text: '#ffffff',
  subtext: '#888',
  accent: '#2ecc71',
  danger: '#ff4d4d'
};

const GROUP_AGES = ["MA", "FA", "MYW", "FYW", "MYU", "FYU", "MSH", "FSH", "MMS", "FMS"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function GoalForm({ onSave, onClose }) {
  const [category, setCategory] = useState('attendance');
  
  // --- STATES FOR ATTENDANCE ---
  const [attData, setAttData] = useState({ 
    attStu1: '', attStu4: '', attStuT: '',
    attOver1: '', attOver4: '', attOverT: '' 
  });

  // --- STATES FOR PREACHING ---
  const [preachData, setPreachData] = useState({ simple: '', valid: '', fruit: '' });

  // --- STATES FOR EVANGELIST ---
  const [isAddingEvang, setIsAddingEvang] = useState(false);
  const [evangList, setEvangList] = useState([]); 
  const [tempEvang, setTempEvang] = useState({ name: '', groupAge: '', schedule: [] });

  const handleAddEvangToList = () => {
    if (!tempEvang.name || !tempEvang.groupAge) {
      Alert.alert("Input Required", "Paki-fill up ang Name at Group Age bago i-add.");
      return;
    }
    setEvangList([...evangList, tempEvang]);
    setTempEvang({ name: '', groupAge: '', schedule: [] });
    setIsAddingEvang(false);
  };

  const toggleDay = (day) => {
    const current = [...tempEvang.schedule];
    const index = current.indexOf(day);
    if (index > -1) current.splice(index, 1);
    else current.push(day);
    setTempEvang({ ...tempEvang, schedule: current });
  };

  const handleSave = () => {
    // Nagpapadala lang ng relevant data base sa category para i-merge sa Dashboard state
    let dataToMerge = {};

    if (category === 'attendance') {
      dataToMerge = {
        attStu1: attData.attStu1, attStu4: attData.attStu4, attStuT: attData.attStuT,
        attOver1: attData.attOver1, attOver4: attData.attOver4, attOverT: attData.attOverT,
      };
    } else if (category === 'preaching') {
      dataToMerge = {
        simpleP: preachData.simple,
        validP: preachData.valid,
        fruitB: preachData.fruit,
      };
    } else if (category === 'evangelist') {
      if (evangList.length === 0 && tempEvang.name) {
         Alert.alert("Paalala", "I-click muna ang 'Confirm Add' bago i-save ang Goal.");
         return;
      }
      dataToMerge = { evangelists: evangList };
    }

    onSave(dataToMerge);
    Alert.alert("Tagumpay!", `Nai-set na ang ${category.toUpperCase()} Goal para sa buwang ito. ✨`);
    onClose();
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SET GOSPEL GOAL</Text>
          <Text style={styles.headerSub}>Zion Network Vision</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* TAB BAR - I-a-adjust ang state pero hindi buburahin ang iba */}
      <View style={styles.tabBar}>
        {['attendance', 'preaching', 'evangelist'].map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.tab, category === cat && styles.activeTab]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.tabText, category === cat && styles.activeTabText]}>
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContent}>
        
        {/* --- ATTENDANCE FORM --- */}
        {category === 'attendance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STUDENT & ABOVE</Text>
            <View style={styles.inputGrid}>
              <MiniInput label="1 Time" value={attData.attStu1} onChange={(v) => setAttData({...attData, attStu1: v})} />
              <MiniInput label="4 Times" value={attData.attStu4} onChange={(v) => setAttData({...attData, attStu4: v})} />
              <MiniInput label="Tithes" value={attData.attStuT} onChange={(v) => setAttData({...attData, attStuT: v})} />
            </View>

            <Text style={[styles.sectionTitle, {marginTop: 25}]}>OVERALL TARGET</Text>
            <View style={styles.inputGrid}>
              <MiniInput label="1 Time" value={attData.attOver1} onChange={(v) => setAttData({...attData, attOver1: v})} />
              <MiniInput label="4 Times" value={attData.attOver4} onChange={(v) => setAttData({...attData, attOver4: v})} />
              <MiniInput label="Tithes" value={attData.attOverT} onChange={(v) => setAttData({...attData, attOverT: v})} />
            </View>
          </View>
        )}

        {/* --- PREACHING FORM --- */}
        {category === 'preaching' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREACHING TARGETS</Text>
            <InputField label="Simple Preaching" value={preachData.simple} onChange={(v) => setPreachData({...preachData, simple: v})} />
            <InputField label="Valid Preaching" value={preachData.valid} onChange={(v) => setPreachData({...preachData, valid: v})} />
            <InputField label="Fruit Baptism" value={preachData.fruit} onChange={(v) => setPreachData({...preachData, fruit: v})} />
          </View>
        )}

        {/* --- EVANGELIST FORM --- */}
        {category === 'evangelist' && (
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <Text style={styles.sectionTitle}>EVANGELIST LIST ({evangList.length})</Text>
              <TouchableOpacity style={styles.addCircle} onPress={() => setIsAddingEvang(!isAddingEvang)}>
                <MaterialCommunityIcons name={isAddingEvang ? "minus" : "plus"} size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* List View */}
            {evangList.map((item, index) => (
              <View key={index} style={styles.evangCard}>
                <View>
                    <Text style={styles.evangName}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.evangInfo}>{item.groupAge} • {item.schedule.join(', ')}</Text>
                </View>
                <TouchableOpacity onPress={() => setEvangList(evangList.filter((_, i) => i !== index))}>
                    <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {isAddingEvang && (
              <View style={styles.innerForm}>
                <InputField label="Full Name" value={tempEvang.name} onChange={(v) => setTempEvang({...tempEvang, name: v})} keyboard="default" />
                
                <Text style={styles.labelSmall}>Group Age</Text>
                <View style={styles.ageGrid}>
                  {GROUP_AGES.map(age => (
                    <TouchableOpacity 
                      key={age} 
                      style={[styles.ageChip, tempEvang.groupAge === age && styles.activeAge]}
                      onPress={() => setTempEvang({...tempEvang, groupAge: age})}
                    >
                      <Text style={[styles.ageText, tempEvang.groupAge === age && {color: '#000'}]}>{age}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.labelSmall}>Schedule</Text>
                <View style={styles.dayGrid}>
                  {DAYS.map(day => (
                    <TouchableOpacity 
                      key={day} 
                      style={[styles.dayCircle, tempEvang.schedule.includes(day) && styles.activeDay]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text style={styles.dayText}>{day[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.confirmAddBtn} onPress={handleAddEvangToList}>
                  <Text style={styles.confirmAddText}>Confirm Add to List</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* SAVE BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>SAVED THE GOAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Reusable Components
const MiniInput = ({ label, value, onChange }) => (
  <View style={styles.miniInputContainer}>
    <Text style={styles.miniLabel}>{label}</Text>
    <TextInput 
      style={styles.miniInput} 
      value={value} 
      onChangeText={onChange} 
      keyboardType="numeric" 
      placeholder="0" 
      placeholderTextColor="#222"
    />
  </View>
);

const InputField = ({ label, value, onChange, keyboard = "numeric" }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.labelSmall}>{label}</Text>
    <TextInput 
      style={styles.fullInput} 
      value={value} 
      onChangeText={onChange} 
      keyboardType={keyboard}
      placeholder="..." 
      placeholderTextColor="#333"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: 40 },
  headerTitle: { color: COLORS.primary, fontSize: 22, fontWeight: '900' },
  headerSub: { color: '#444', fontSize: 12, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#111', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 15, padding: 5, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: '#444', fontSize: 10, fontWeight: '900' },
  activeTabText: { color: '#000' },

  formContent: { flex: 1, paddingHorizontal: 25 },
  section: { marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginBottom: 15, letterSpacing: 0.5 },
  
  inputGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  miniInputContainer: { width: '31%' },
  miniLabel: { color: '#555', fontSize: 10, marginBottom: 6, fontWeight: 'bold', textAlign: 'center' },
  miniInput: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 15, color: COLORS.primary, fontSize: 18, fontWeight: '900', textAlign: 'center', borderWidth: 1, borderColor: '#222' },

  inputGroup: { marginBottom: 15 },
  labelSmall: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  fullInput: { backgroundColor: '#0a0a0a', borderRadius: 15, padding: 15, color: '#fff', fontSize: 16, fontWeight: 'bold', borderWidth: 1, borderColor: '#222' },

  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addCircle: { backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  evangCard: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  evangName: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  evangInfo: { color: '#888', fontSize: 10, marginTop: 2 },

  innerForm: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '22', marginTop: 5 },
  ageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  ageChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#050505', borderWidth: 1, borderColor: '#222' },
  activeAge: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ageText: { color: '#555', fontSize: 10, fontWeight: 'bold' },
  
  dayGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  activeDay: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  confirmAddBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center' },
  confirmAddText: { color: '#000', fontWeight: '900', fontSize: 12 },

  footer: { padding: 25, paddingBottom: 40 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 20, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});