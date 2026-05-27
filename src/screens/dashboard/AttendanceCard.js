import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore'; 
import { supabase } from '../../utils/supabase';   

const COLORS = {
  primary: '#26f7ff',       // Cyan Highlight
  card: '#121214',          // Elevated Material Dark Card background
  text: '#ffffff',          // Pure White
  accent: '#ff4d4d',        // Deep Red para sa Warning Alerts
  subtext: '#a0a5b5',       // Bright Slate Gray
  border: '#232329',        // Higit na litaw na border framing
  success: '#2ecc71',       // Bright Green para sa Tithes
  warning: '#f1c40f',       // Amber/Yellow
  silver: '#e1e4ed'         // High-contrast label gray
};

// 🎯 KORREKTED AGE GROUPS FILTER (Tugma sa database short codes sa 1000088295.png)
// Bukod kay 'Male Elderly' at 'Female Elderly', isinama ang MA, FA, MW, MU, MS, at FS.
// Hindi kasama rito ang 'Elem' at 'Child'.
const VALID_AGE_GROUPS = [
  'Male Elderly', 'Female Elderly',
  'MA', 'FA', // Male Adult, Female Adult
  'MW', 'MU', // Young Adult / Workers short mappings
  'MS', 'FS'  // Mid Sch, High Sch, o Youth sub-designations
];

export default function AttendanceCard() {
  const { userProfile } = useAuthStore();
  
  // LIVE ATTENDANCE STATES
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceMetrics, setAttendanceMetrics] = useState({ count1X: 0, count4X: 0, totalTithes: 0 });
  const [noAttendanceAlerts, setNoAttendanceAlerts] = useState([]);
  const [isAlertActive, setIsAlertActive] = useState(false);

  // REALTIME ENGINE WITH SHORT CODE TENANT ISOLATION
  const calculateLiveAttendanceMetrics = async () => {
    if (!userProfile?.zion_code) return;
    try {
      const currentYear = new Date().getFullYear();
      const currentMonthNum = new Date().getMonth() + 1;
      const currentDay = new Date().getDate();

      // Alert active paglagpas ng 1st Week (Day 7 pataas)
      if (currentDay > 7) {
        setIsAlertActive(true);
      } else {
        setIsAlertActive(false);
      }

      // 1. Kuhanin ang lahat ng miyembro ng branch
      const { data: members, error: mErr } = await supabase
        .from('attendance_members')
        .select('id, full_name, age_group')
        .eq('zion_code', userProfile.zion_code);
      if (mErr) throw mErr;

      // 2. Kuhanin ang active weekly logs para sa kasalukuyang buwan at taon
      const { data: logs, error: lErr } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('zion_code', userProfile.zion_code)
        .eq('year', currentYear)
        .eq('month', currentMonthNum);
      if (lErr) throw lErr;

      // 3. Kuhanin ang active tithe payment records para sa kasalukuyang buwan
      const { data: tithes, error: tErr } = await supabase
        .from('attendance_tithes')
        .select('member_id, has_paid')
        .eq('zion_code', userProfile.zion_code)
        .eq('year', currentYear)
        .eq('month', currentMonthNum)
        .eq('has_paid', true);
      if (tErr) throw tErr;

      // Map para sa mabilis na pag-track ng attendance logs count
      let memberSessionsMap = {};
      if (members) {
        members.forEach(m => { memberSessionsMap[m.id] = 0; });
      }

      if (logs) {
        logs.forEach(log => {
          let presentCount = (log.w1 ? 1 : 0) + (log.w2 ? 1 : 0) + (log.w3 ? 1 : 0) + (log.w4 ? 1 : 0) + (log.w5 ? 1 : 0);
          if (memberSessionsMap[log.member_id] !== undefined) {
            memberSessionsMap[log.member_id] += presentCount;
          }
        });
      }

      // Filtered Tithes base sa standardized short groups natin
      let validTithesCount = 0;
      if (tithes && members) {
        const activeTitheMemberIds = tithes.map(t => t.member_id);
        const filteredTitheMembers = members.filter(m => 
          activeTitheMemberIds.includes(m.id) && VALID_AGE_GROUPS.includes(m.age_group)
        );
        validTithesCount = filteredTitheMembers.length;
      }

      let count1X = 0;
      let count4X = 0;
      let zeroAttendanceList = [];

      if (members) {
        members.forEach(m => {
          // CHECKPOINT MATCHING: Dapat pasok sa short-code criteria, iwasan ang Elem/Child
          if (!VALID_AGE_GROUPS.includes(m.age_group)) return;

          const totalSessions = memberSessionsMap[m.id];
          if (totalSessions >= 1 && totalSessions <= 3) {
            count1X++;
          } else if (totalSessions >= 4) {
            count4X++;
          } else if (totalSessions === 0) {
            const firstName = m.full_name.split(' ')[0];
            zeroAttendanceList.push({ name: firstName, ageGroup: m.age_group });
          }
        });
      }

      setAttendanceMetrics({
        count1X,
        count4X,
        totalTithes: validTithesCount
      });
      setNoAttendanceAlerts(zeroAttendanceList);

    } catch (err) {
      console.error("❌ ATTENDANCE_CARD: Mapping evaluation error:", err.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    calculateLiveAttendanceMetrics();
    const globalSyncTimer = setInterval(calculateLiveAttendanceMetrics, 10000);
    return () => clearInterval(globalSyncTimer);
  }, [userProfile?.zion_code]);

  return (
    <View style={styles.container}>
      {/* CARD HEADER */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Live Attendance Update</Text>
      </View>

      {/* SIDE-BY-SIDE SPLIT LAYOUT */}
      <View style={styles.sectionSplitWrapper}>
        
        {/* PAHANGAL MATRIX CORES REPORT */}
        <View style={styles.matrixContainer}>
          <Text style={styles.innerSectionHeading}>📊 RECORD MATRIX</Text>
          {attendanceLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.horizontalMetricsGrid}>
              
              <View style={styles.horizontalMetricBox}>
                <Text style={[styles.bigMetricNumber, { color: COLORS.warning }]}>
                  {attendanceMetrics.count1X}
                </Text>
                <Text style={styles.metricLabelLegend}>1 Time Attendance</Text>
              </View>

              <View style={styles.horizontalMetricBox}>
                <Text style={[styles.bigMetricNumber, { color: COLORS.primary }]}>
                  {attendanceMetrics.count4X}
                </Text>
                <Text style={styles.metricLabelLegend}>4 Times Attendance</Text>
              </View>

              <View style={[styles.horizontalMetricBox, { borderRightWidth: 0 }]}>
                <Text style={[styles.bigMetricNumber, { color: COLORS.success }]}>
                  {attendanceMetrics.totalTithes}
                </Text>
                <Text style={styles.metricLabelLegend}>Tithes Participants</Text>
              </View>

            </View>
          )}
        </View>

        {/* CONDITIONAL REALTIME WARNING BOX (KANAN) */}
        <View style={[styles.alertContainer, !isAlertActive && { opacity: 0.5 }]}>
          <Text style={styles.alertCardHeadingText}>⚠️ NO ATTENDANCE</Text>
          {isAlertActive ? (
            <ScrollView style={styles.alertNamesContainerScroll} showsVerticalScrollIndicator={true}>
              {noAttendanceAlerts.length === 0 ? (
                <Text style={styles.allPresentCleanText}>All registered members have logged records.</Text>
              ) : (
                noAttendanceAlerts.map((member, mIdx) => (
                  <Text key={mIdx} style={styles.alertMemberNameRowText}>
                    • {member.name} <Text style={{ color: COLORS.warning, fontSize: 8 }}>[{member.ageGroup}]</Text>
                  </Text>
                ))
              )}
            </ScrollView>
          ) : (
            <Text style={styles.waitingWeekText}>Monitoring window unlocks after the 1st week.</Text>
          )}
        </View>

      </View>
      
      {/* SOLID ACCENT RIBBON */}
      <View style={styles.footerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  sectionSplitWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  matrixContainer: {
    width: '56%',
    backgroundColor: '#16161a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2d3139',
  },
  innerSectionHeading: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  horizontalMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  horizontalMetricBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#232329',
    paddingHorizontal: 4,
  },
  bigMetricNumber: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricLabelLegend: {
    color: COLORS.subtext,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  alertContainer: {
    width: '41%',
    backgroundColor: '#140c0c',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4a1515',
  },
  alertCardHeadingText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  alertNamesContainerScroll: {
    maxHeight: 90,
  },
  allPresentCleanText: {
    color: '#888',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 5,
  },
  alertMemberNameRowText: {
    color: '#ffb3b3',
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 2,
    letterSpacing: 0.3,
  },
  waitingWeekText: {
    color: '#666',
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 15,
  },
  footerLine: {
    height: 2,
    backgroundColor: COLORS.primary,
    width: '30%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 1,
    opacity: 0.5,
  }
});