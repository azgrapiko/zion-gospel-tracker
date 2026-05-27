import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../utils/supabase';
import useAuthStore from '../store/authStore'; // IN-IMPORT ANG GLOBALLY CACHED AUTHOSTORE

// EXPLICIT AGE GROUP HIERARCHY INDEX MAP
const AGE_GROUP_ORDER = {
  'MA': 1,
  'Male Elderly': 2,
  'FA': 3,
  'Female Elderly': 4,
  'MW': 5,
  'FW': 6,
  'MU': 7,
  'FU': 8,
  'MHS': 9,
  'FHS': 10,
  'MS': 11,
  'FS': 12,
  'Elem': 13,
  'Child': 14
};

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); 
  const [titheData, setTitheData] = useState({}); 
  const [historyTotals, setHistoryTotals] = useState({}); 

  // Modal / Form Toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  
  // NEW STATE: Para ihiwalay ang Input mode ng Grid sa pag-add ng Member
  const [isInputModeActive, setIsInputModeActive] = useState(false);

  // KINUKUHA ANG AKTIBONG BRAND CODE NG BRANCH GALING SA ZUSTAND STORE
  const { zionCode } = useAuthStore();

  // Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formAgeGroup, setFormAgeGroup] = useState('MA');
  const [formUnit, setFormUnit] = useState('1');

  // Filters
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = (new Date().getMonth() + 1).toString();
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Week Visibility Toggles
  const [visibleWeeks, setVisibleWeeks] = useState({ w1: true, w2: true, w3: true, w4: true, w5: true });

  // Column Headers Table Filters
  const [filterName, setFilterName] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterTithe, setFilterTithe] = useState(false);
  const [filterTotalAttend, setFilterTotalAttend] = useState('');

  const ageGroupMapping = [
    { label: "Male Adult (MA)", value: "MA" },
    { label: "Male Elderly (Elderly)", value: "Elderly" },
    { label: "Female Adult (FA)", value: "FA" },
    { label: "Female Elderly (Elderly)", value: "Elderly" },
    { label: "Male Young Worker (MW)", value: "MW" },
    { label: "Female Young Worker (FW)", value: "FW" },
    { label: "Male Young Univ. (MU)", value: "MU" },
    { label: "Female Young Univ. (FU)", value: "FU" },
    { label: "Male High Sch. (MHS)", value: "MHS" },
    { label: "Female High Sch. (FHS)", value: "FHS" },
    { label: "Male Mid. Sch. (MS)", value: "MS" },
    { label: "Female Mid. Sch. (FS)", value: "FS" },
    { label: "Male Elem. (Elem)", value: "Elem" },
    { label: "Female Elem. (Elem)", value: "Elem" },
    { label: "Male Child. (Child)", value: "Child" },
    { label: "Female Child. (Child)", value: "Child" },
  ];

  const showAlert = (msg) => { if (Platform.OS === 'web') window.alert(msg); };

  useEffect(() => { fetchCoreAttendanceRecords(); }, [selectedYear, selectedMonth, zionCode]);

  const fetchCoreAttendanceRecords = async () => {
    if (!zionCode) return;
    setLoading(true);
    try {
      // STRICT MULTI-TENANCY FILTERING: Kumukuha lamang ng members para sa lokal na zion_code
      const { data: memberList, error: mErr } = await supabase
        .from('attendance_members')
        .select('*')
        .eq('zion_code', zionCode);
      if (mErr) throw mErr;

      // Client-side Custom Sort Engine
      const sortedMemberList = [...memberList].sort((a, b) => {
        const rankA = AGE_GROUP_ORDER[a.age_group] || 99;
        const rankB = AGE_GROUP_ORDER[b.age_group] || 99;
        if (rankA !== rankB) return rankA - rankB;
        return (a.unit || 0) - (b.unit || 0);
      });

      const { data: logs, error: lErr } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('zion_code', zionCode)
        .eq('year', parseInt(selectedYear))
        .eq('month', parseInt(selectedMonth));
      if (lErr) throw lErr;

      const { data: tithes, error: tErr } = await supabase
        .from('attendance_tithes')
        .select('*')
        .eq('zion_code', zionCode)
        .eq('year', parseInt(selectedYear))
        .eq('month', parseInt(selectedMonth));
      if (tErr) throw tErr;

      let histMap = {};
      sortedMemberList.forEach(m => { histMap[m.id] = { m1: 0, m2: 0, m3: 0 }; });

      const computeHistoryForOffset = async (offset, key) => {
        let targetMonth = parseInt(selectedMonth) - offset;
        let targetYear = parseInt(selectedYear);
        if (targetMonth <= 0) { targetMonth += 12; targetYear -= 1; }
        const { data: hLogs } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('zion_code', zionCode)
          .eq('year', targetYear)
          .eq('month', targetMonth);
        if (hLogs) {
          hLogs.forEach(log => {
            let count = (log.w1 ? 1 : 0) + (log.w2 ? 1 : 0) + (log.w3 ? 1 : 0) + (log.w4 ? 1 : 0) + (log.w5 ? 1 : 0);
            if (histMap[log.member_id]) histMap[log.member_id][key] += count;
          });
        }
      };

      await computeHistoryForOffset(1, 'm1');
      await computeHistoryForOffset(2, 'm2');
      await computeHistoryForOffset(3, 'm3');

      let structuredLogs = {};
      let structuredTithes = {};

      sortedMemberList.forEach(m => {
        structuredTithes[m.id] = false;
        structuredLogs[m.id] = {
          '3rd_day': { w1: false, w2: false, w3: false, w4: false, w5: false },
          'sabbath_morning': { w1: false, w2: false, w3: false, w4: false, w5: false },
          'sabbath_afternoon': { w1: false, w2: false, w3: false, w4: false, w5: false },
          'sabbath_evening': { w1: false, w2: false, w3: false, w4: false, w5: false }
        };
      });

      logs.forEach(log => {
        if (structuredLogs[log.member_id]?.[log.service_type]) {
          structuredLogs[log.member_id][log.service_type] = {
            w1: log.w1, w2: log.w2, w3: log.w3, w4: log.w4, w5: log.w5
          };
        }
      });

      tithes.forEach(t => { structuredTithes[t.member_id] = t.has_paid; });

      setMembers(sortedMemberList);
      setAttendanceData(structuredLogs);
      setTitheData(structuredTithes);
      setHistoryTotals(histMap);
    } catch (err) {
      showAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async () => {
    if (!formFullName.trim()) return showAlert("Pakisulat ang buong pangalan.");
    if (!zionCode) return showAlert("System Error: Missing Zion Branch Code.");
    setLoading(true);
    try {
      if (editingMemberId) {
        const { error } = await supabase
          .from('attendance_members')
          .update({ full_name: formFullName.trim(), age_group: formAgeGroup, unit: parseInt(formUnit) })
          .eq('id', editingMemberId);
        if (error) throw error;
        showAlert("Member Profile Updated!");
      } else {
        // MULTI-TENANCY INJECTION: Awtomatikong pinapapasa ang zion_code ng admin sa bagong row
        const { error } = await supabase
          .from('attendance_members')
          .insert([{ full_name: formFullName.trim(), age_group: formAgeGroup, unit: parseInt(formUnit), zion_code: zionCode }]);
        if (error) throw error;
        showAlert("Bagong miyembro ay matagumpay na naisave!");
      }
      setFormFullName('');
      setEditingMemberId(null);
      setShowAddForm(false);
      fetchCoreAttendanceRecords();
    } catch (err) {
      showAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (Platform.OS === 'web' && !window.confirm("Sigurado ka bang buburahin ito?")) return;
    try {
      const { error } = await supabase.from('attendance_members').delete().eq('id', id);
      if (error) throw error;
      fetchCoreAttendanceRecords();
    } catch (err) { showAlert(err.message); }
  };

  const toggleCell = (memberId, serviceType, weekKey) => {
    // PROTEKSYON: Kung sarado ang input mode, pigilan ang pagpindot
    if (!isInputModeActive) {
      showAlert("⚠️ Naka-lock ang Table. Pindutin muna ang 'Input' button sa itaas para mag-edit.");
      return;
    }
    setAttendanceData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [serviceType]: {
          ...prev[memberId][serviceType],
          [weekKey]: !prev[memberId][serviceType][weekKey]
        }
      }
    }));
  };

  const toggleTitheCell = (memberId) => {
    // PROTEKSYON: Kung sarado ang input mode, pigilan ang pagpindot
    if (!isInputModeActive) {
      showAlert("⚠️ Naka-lock ang Table. Pindutin muna ang 'Input' button sa itaas para mag-edit.");
      return;
    }
    setTitheData(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleBulkSaveToCloud = async () => {
    if (!zionCode) return showAlert("Unauthorized session context.");
    setLoading(true);
    try {
      const y = parseInt(selectedYear);
      const m = parseInt(selectedMonth);

      let logPayloads = [];
      Object.keys(attendanceData).forEach(mId => {
        Object.keys(attendanceData[mId]).forEach(sType => {
          const cells = attendanceData[mId][sType];
          logPayloads.push({
            member_id: mId, year: y, month: m, service_type: sType,
            w1: cells.w1, w2: cells.w2, w3: cells.w3, w4: cells.w4, w5: cells.w5,
            zion_code: zionCode // MULTI-TENANCY STORAGE COMPLIANCE
          });
        });
      });

      const { error: logErr } = await supabase.from('attendance_logs').upsert(logPayloads, { onConflict: 'member_id,year,month,service_type' });
      if (logErr) throw logErr;

      let tithePayloads = [];
      Object.keys(titheData).forEach(mId => {
        tithePayloads.push({ member_id: mId, year: y, month: m, has_paid: titheData[mId], zion_code: zionCode });
      });

      const { error: titheErr } = await supabase.from('attendance_tithes').upsert(tithePayloads, { onConflict: 'member_id,year,month' });
      if (titheErr) throw titheErr;

      showAlert("Data Saved successfully to your Supabase instances! 💾");
      
      // I-lock ulit ang table pagkatapos i-save para iwas aksidente
      setIsInputModeActive(false);
      
      fetchCoreAttendanceRecords();
    } catch (err) {
      showAlert("Save Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMemberTotalRow = (mId) => {
    let grandTotal = 0;
    if (attendanceData[mId]) {
      Object.keys(attendanceData[mId]).forEach(sType => {
        const row = attendanceData[mId][sType];
        grandTotal += (row.w1 ? 1 : 0) + (row.w2 ? 1 : 0) + (row.w3 ? 1 : 0) + (row.w4 ? 1 : 0) + (row.w5 ? 1 : 0);
      });
    }
    return grandTotal;
  };

  const determineBorderColor = (mId) => {
    const total = calculateMemberTotalRow(mId);
    if (titheData[mId]) return '#2ecc71'; 
    if (total >= 4) return '#3498db'; 
    if (total >= 1 && total <= 3) return '#f1c40f'; 
    return '#e74c3c'; 
  };

  const filteredMembers = members.filter(m => {
    const matchName = m.full_name.toLowerCase().includes(filterName.toLowerCase());
    const matchAge = m.age_group.toLowerCase().includes(filterAgeGroup.toLowerCase());
    const matchUnit = filterUnit ? m.unit.toString() === filterUnit : true;
    const matchTithe = filterTithe ? titheData[m.id] === true : true;
    const currentTotal = calculateMemberTotalRow(m.id);
    const matchTotalFilter = filterTotalAttend ? currentTotal.toString() === filterTotalAttend.trim() : true;
    return matchName && matchAge && matchUnit && matchTithe && matchTotalFilter;
  });

  const renderWeekCells = (mId, serviceKey, weekKey) => {
    if (!visibleWeeks[weekKey]) return null;
    const isChecked = attendanceData[mId]?.[serviceKey]?.[weekKey];
    return (
      <TouchableOpacity style={styles.gridCellInteractive} onPress={() => toggleCell(mId, serviceKey, weekKey)}>
        <Text style={[styles.gridCellText, isChecked && styles.textChecked]}>
          {isChecked ? "1" : "•"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#090b0e' }}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* TOP CONFIG BAR */}
        <View style={styles.topControlRow}>
          <View style={styles.topLeftSelectors}>
            <View style={styles.miniPicker}>
              <Picker selectedValue={selectedMonth} onValueChange={(v)=>setSelectedMonth(v)} style={styles.nativePickerElement}>
                {Array.from({ length: 12 }, (_, i) => (
                  <Picker.Item key={i+1} label={`2026 - ${String(i+1).padStart(2, '0')}`} value={(i+1).toString()} color="#000000"/>
                ))}
              </Picker>
            </View>

            <View style={styles.weekCheckboxContainer}>
              {['w1', 'w2', 'w3', 'w4', 'w5'].map((wKey, index) => (
                <TouchableOpacity key={wKey} style={[styles.weekToggleChip, visibleWeeks[wKey] && styles.weekToggleChipActive]} onPress={() => setVisibleWeeks(p => ({ ...p, [wKey]: !p[wKey] }))}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    {visibleWeeks[wKey] ? '✅' : '☑️'} {index+1}st Week
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#475569' }]} onPress={fetchCoreAttendanceRecords}>
              <Text style={styles.btnActionText}>🔄 Refresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnAction, { backgroundColor: isInputModeActive ? '#d97706' : '#1e3a8a' }]} 
              onPress={() => setIsInputModeActive(!isInputModeActive)}
            >
              <Text style={styles.btnActionText}>{isInputModeActive ? "🔒 Lock Grid" : "📝 Input Mode"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#1e3a8a' }]} onPress={handleBulkSaveToCloud}>
              <Text style={styles.btnActionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#15803d' }]} onPress={() => { setEditingMemberId(null); setFormFullName(''); setShowAddForm(!showAddForm); }}>
              <Text style={styles.btnActionText}>+ Open Add-On Window</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MEMBER INPUT POPUP FRAME */}
        {showAddForm && (
          <View style={styles.memberFormPanel}>
            <Text style={styles.formPanelTitle}>{editingMemberId ? "✏️ Edit Member Configuration" : "✨ Create New Roster Member"}</Text>
            <View style={styles.formFieldsWrapper}>
              <TextInput placeholder="Fullname..." placeholderTextColor="#888" value={formFullName} onChangeText={setFormFullName} style={styles.fieldInput} />
              
              <View style={styles.formPickerWrapper}>
                <Picker selectedValue={formAgeGroup} onValueChange={(v)=>setFormAgeGroup(v)} style={styles.pickerBlackText}>
                  {ageGroupMapping.map(item => <Picker.Item key={item.value} label={item.label} value={item.value} color="#000000" />)}
                </Picker>
              </View>
              <View style={styles.formPickerWrapper}>
                <Picker selectedValue={formUnit} onValueChange={(v)=>setFormUnit(v)} style={styles.pickerBlackText}>
                  {[1,2,3,4,5].map(n => <Picker.Item key={n} label={`Unit ${n}`} value={n.toString()} color="#000000" />)}
                </Picker>
              </View>
              <TouchableOpacity style={styles.btnSubmitMember} onPress={handleSaveMember}>
                <Text style={{ color: '#fff', fontWeight: '900' }}>SUBMIT TO ROSTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading && <ActivityIndicator size="small" color="#26f7ff" style={{ marginVertical: 10 }} />}

        {/* SPREADSHEET MATRIX TABLE */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableMatrixContainer}>
            
            {/* MAIN SUPER HEADERS ROW */}
            <View style={[styles.tableRow, styles.tableHeaderSuperRow]}>
              <Text style={[styles.superHeaderCell, { width: 40 }]}>No.</Text>
              <Text style={[styles.superHeaderCell, { width: 170 }]}>Name in Native Language</Text>
              <Text style={[styles.superHeaderCell, { width: 50 }]}>Age G.</Text>
              <Text style={[styles.superHeaderCell, { width: 40 }]}>Unit</Text>
              
              {/* HORIZONTAL WEEKS SECTIONS */}
              {visibleWeeks.w1 && <Text style={[styles.superHeaderCell, { width: 140, backgroundColor: '#202530', borderRightWidth: 1, borderColor: '#444' }]}>1st Week</Text>}
              {visibleWeeks.w2 && <Text style={[styles.superHeaderCell, { width: 140, backgroundColor: '#252a35', borderRightWidth: 1, borderColor: '#444' }]}>2nd Week</Text>}
              {visibleWeeks.w3 && <Text style={[styles.superHeaderCell, { width: 140, backgroundColor: '#202530', borderRightWidth: 1, borderColor: '#444' }]}>3rd Week</Text>}
              {visibleWeeks.w4 && <Text style={[styles.superHeaderCell, { width: 140, backgroundColor: '#252a35', borderRightWidth: 1, borderColor: '#444' }]}>4th Week</Text>}
              {visibleWeeks.w5 && <Text style={[styles.superHeaderCell, { width: 140, backgroundColor: '#202530', borderRightWidth: 1, borderColor: '#444' }]}>5th Week</Text>}

              <Text style={[styles.superHeaderCell, { width: 45 }]}>Tithe</Text>
              <Text style={[styles.superHeaderCell, { width: 50, color: '#26f7ff' }]}>Attend</Text>
              <Text style={[styles.superHeaderCell, { width: 45 }]}>(-1M.)</Text>
              <Text style={[styles.superHeaderCell, { width: 45 }]}>(-2M.)</Text>
              <Text style={[styles.superHeaderCell, { width: 45 }]}>(-3M.)</Text>
              <Text style={[styles.superHeaderCell, { width: 90 }]}>Modify</Text>
            </View>

            {/* SERVICE SUB-CATEGORY TITLES ROW */}
            <View style={[styles.tableRow, styles.tableHeaderSubRow]}>
              <View style={{ width: 40 }} /><View style={{ width: 170 }} /><View style={{ width: 50 }} /><View style={{ width: 40 }} />
              
              {['w1', 'w2', 'w3', 'w4', 'w5'].map(wKey => visibleWeeks[wKey] && (
                <View key={wKey} style={{ flexDirection: 'row', width: 140 }}>
                  <Text style={styles.subHeaderServiceCell}>3rd</Text>
                  <Text style={styles.subHeaderServiceCell}>Morn</Text>
                  <Text style={styles.subHeaderServiceCell}>Aftn</Text>
                  <Text style={styles.subHeaderServiceCell}>Eve</Text>
                </View>
              ))}

              <View style={{ width: 45 }} /><View style={{ width: 50 }} /><View style={{ width: 45 }} /><View style={{ width: 45 }} /><View style={{ width: 45 }} /><View style={{ width: 90 }} />
            </View>

            {/* FILTERS INPUT FIELD ROW */}
            <View style={[styles.tableRow, { backgroundColor: '#13151a' }]}>
              <View style={{ width: 40 }} />
              <TextInput style={[styles.filterInputCell, { width: 170 }]} placeholder="🔍 Name..." placeholderTextColor="#555" value={filterName} onChangeText={setFilterName} />
              <TextInput style={[styles.filterInputCell, { width: 50 }]} placeholder="Group" placeholderTextColor="#555" value={filterAgeGroup} onChangeText={setFilterAgeGroup} />
              <TextInput style={[styles.filterInputCell, { width: 40 }]} placeholder="Unit" placeholderTextColor="#555" value={filterUnit} onChangeText={setFilterUnit} />
              
              {['w1', 'w2', 'w3', 'w4', 'w5'].map(w => visibleWeeks[w] && <View key={w} style={{ width: 140 }} />)}

              <TouchableOpacity style={[styles.filterInputCell, { width: 45, justifyContent: 'center' }]} onPress={() => setFilterTithe(!filterTithe)}>
                <Text style={{ fontSize: 9, color: filterTithe ? '#2ecc71' : '#555', textAlign:'center', fontWeight:'bold' }}>{filterTithe ? "✅" : "ALL"}</Text>
              </TouchableOpacity>
              <TextInput style={[styles.filterInputCell, { width: 50 }]} placeholder="Num" placeholderTextColor="#555" value={filterTotalAttend} onChangeText={setFilterTotalAttend} />
              <View style={{ width: 45 }} /><View style={{ width: 45 }} /><View style={{ width: 45 }} /><View style={{ width: 90 }} />
            </View>

            {/* CONDENSED SPREADSHEET MEMBERS ITERATION */}
            {filteredMembers.map((member, index) => {
              const mId = member.id;
              const liveTotal = calculateMemberTotalRow(mId);
              const past = historyTotals[mId] || { m1: 0, m2: 0, m3: 0 };
              const statusBorderColor = determineBorderColor(mId);

              return (
                <View key={mId} style={[styles.spreadsheetRow, { borderColor: statusBorderColor, opacity: isInputModeActive ? 1 : 0.88 }]}>
                  {/* Roster Metadata Info */}
                  <Text style={[styles.bodyGridCell, { width: 40, color: '#888', textAlign: 'center' }]}>{index + 1}</Text>
                  <Text style={[styles.bodyGridCell, { width: 170, color: '#ffffff', textAlign: 'left', fontWeight: '700' }]} numberOfLines={1}>{member.full_name}</Text>
                  <Text style={[styles.bodyGridCell, { width: 50, color: '#f1c40f', textAlign: 'center', fontWeight: '600' }]}>{member.age_group}</Text>
                  <Text style={[styles.bodyGridCell, { width: 40, color: '#ffffff', textAlign: 'center' }]}>{member.unit}</Text>

                  {/* SPREADSHEET MATRIX HORIZONTAL BLOCKS MAP */}
                  {['w1', 'w2', 'w3', 'w4', 'w5'].map(wKey => visibleWeeks[wKey] && (
                    <View key={wKey} style={styles.horizontalWeekGroupBlock}>
                      {renderWeekCells(mId, '3rd_day', wKey)}
                      {renderWeekCells(mId, 'sabbath_morning', wKey)}
                      {renderWeekCells(mId, 'sabbath_afternoon', wKey)}
                      {renderWeekCells(mId, 'sabbath_evening', wKey)}
                    </View>
                  ))}

                  {/* TITHE INTERACTIVE BOX */}
                  <TouchableOpacity style={[styles.gridCellInteractive, { width: 45 }]} onPress={() => toggleTitheCell(mId)}>
                    <Text style={{ fontSize: 12, textAlign: 'center' }}>{titheData[mId] ? "🟩" : "▪️"}</Text>
                  </TouchableOpacity>

                  {/* COMPUTED SUM MARGINS */}
                  <Text style={[styles.bodyGridCell, { width: 50, color: '#26f7ff', fontWeight: 'bold', textAlign: 'center' }]}>{liveTotal}</Text>
                  <Text style={[styles.bodyGridCell, { width: 45, color: '#777', textAlign: 'center' }]}>{past.m1}</Text>
                  <Text style={[styles.bodyGridCell, { width: 45, color: '#777', textAlign: 'center' }]}>{past.m2}</Text>
                  <Text style={[styles.bodyGridCell, { width: 45, color: '#777', textAlign: 'center' }]}>{past.m3}</Text>

                  {/* MANAGEMENT CONTROL ACTIONS BUTTONS */}
                  <View style={{ width: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => { setEditingMemberId(mId); setFormFullName(member.full_name); setFormAgeGroup(member.age_group); setFormUnit(member.unit.toString()); setShowAddForm(true); }}>
                      <Text style={{ color: '#3498db', fontSize: 10, fontWeight: 'bold' }}>EDIT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteMember(mId)}>
                      <Text style={{ color: '#e74c3c', fontSize: 10, fontWeight: 'bold' }}>DEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090b0e', padding: 10 },
  topControlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 },
  topLeftSelectors: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniPicker: { backgroundColor: '#161b22', borderRadius: 4, borderWidth: 1, borderColor: '#30363d', width: 140, height: 34, justifyContent: 'center' },
  nativePickerElement: { color: '#0a5254', fontSize: 12, background: 'transparent', border: 'none', paddingLeft: 4 },
  weekCheckboxContainer: { flexDirection: 'row', gap: 4 },
  weekToggleChip: { backgroundColor: '#161b22', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#30363d' },
  weekToggleChipActive: { borderColor: '#26f7ff', backgroundColor: '#1e293b' },
  topRightActions: { flexDirection: 'row', gap: 6 },
  btnAction: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, justifyContent: 'center' },
  btnActionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  memberFormPanel: { backgroundColor: '#ffffff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  formPanelTitle: { color: '#111', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  formFieldsWrapper: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  fieldInput: { backgroundColor: '#fff', color: '#000', fontSize: 12, padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#999', width: 180 },
  formPickerWrapper: { backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#999', width: 160, height: 34, justifyContent: 'center' },
  
  pickerBlackText: { color: '#000000', fontSize: 12, fontWeight: '700', backgroundColor: '#ffffff' },
  btnSubmitMember: { backgroundColor: '#1e3a8a', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4 },

  tableMatrixContainer: { flexDirection: 'column', backgroundColor: '#0f1115', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  
  tableHeaderSuperRow: { backgroundColor: '#1a1f2c', borderBottomWidth: 1, borderColor: '#444', height: 32 },
  tableHeaderSubRow: { backgroundColor: '#242b3c', borderBottomWidth: 1, borderColor: '#383f50', height: 24 },
  
  superHeaderCell: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', textAlign: 'center', paddingVertical: 4, letterSpacing: 0.3 },
  subHeaderServiceCell: { width: 35, color: '#E2E8F0', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  
  filterInputCell: { backgroundColor: '#090b0e', color: '#fff', fontSize: 10, padding: 4, borderRadius: 4, borderWidth: 1, borderColor: '#333', height: 24, marginHorizontal: 1, textAlign: 'center' },
  
  spreadsheetRow: { flexDirection: 'row', alignItems: 'center', height: 28, borderBottomWidth: 1, borderColor: '#222', backgroundColor: '#11141a', borderLeftWidth: 3 },
  bodyGridCell: { fontSize: 11, paddingHorizontal: 4 },
  horizontalWeekGroupBlock: { flexDirection: 'row', width: 140, borderRightWidth: 1, borderColor: '#222', height: '100%', alignItems: 'center' },
  gridCellInteractive: { width: 35, height: '100%', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#1a1d24' },
  gridCellText: { color: '#333b48', fontSize: 11, fontWeight: 'bold' },
  textChecked: { color: '#3498db', fontSize: 12, fontWeight: '900' }
});