import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
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

const VALID_AGE_GROUPS = [
  'Male Elderly', 'Female Elderly',
  'MA', 'FA', 
  'MW', 'MU', 'MY',
  'FW', 'FU', 'FY',
  'Male High Sch', 'Male Mid Sch', 'MS',
  'Female High Sch', 'Female Mid Sch', 'FS'
];

// DETERMINISTIC ALERTS SORTING ORDER HIERARCHY
const AGE_SORT_ORDER = {
  'Male Elderly': 1, 'Female Elderly': 2,
  'MA': 3, 'FA': 4,
  'MW': 5, 'MU': 6, 'MY': 7, 'FW': 8, 'FU': 9, 'FY': 10,
  'Male High Sch': 11, 'Male Mid Sch': 12, 'MS': 13,
  'Female High Sch': 14, 'Female Mid Sch': 15, 'FS': 16
};

export default function AttendanceCard() {
  const { userProfile } = useAuthStore();
  
  // LIVE ATTENDANCE STATES
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceMetrics, setAttendanceMetrics] = useState({ count1X: 0, count4X: 0, totalTithes: 0 });
  const [groupBreakdown, setGroupBreakdown] = useState({ ma: 0, fa: 0, fy: 0, my: 0, ms: 0, fs: 0 });
  const [noAttendanceAlerts, setNoAttendanceAlerts] = useState([]);
  const [isAlertActive, setIsAlertActive] = useState(false);

  // 💓 HEARTBEAT INDICATOR ANIMATION REF
  const heartbeatAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.08,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [heartbeatAnim]);

  // REALTIME ENGINE WITH INCLUSIVE HEADCOUNT AGGREGATIONS
  const calculateLiveAttendanceMetrics = async () => {
    if (!userProfile?.zion_code) return;
    try {
      const currentYear = new Date().getFullYear();
      const currentMonthNum = new Date().getMonth() + 1;
      const currentDay = new Date().getDate();

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

      // 2. Kuhanin ang active logs para sa kasalukuyang buwan
      const { data: logs, error: lErr } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('zion_code', userProfile.zion_code)
        .eq('year', currentYear)
        .eq('month', currentMonthNum);
      if (lErr) throw lErr;

      // 3. Kuhanin ang active tithe records para sa kasalukuyang buwan
      const { data: tithes, error: tErr } = await supabase
        .from('attendance_tithes')
        .select('member_id, has_paid')
        .eq('zion_code', userProfile.zion_code)
        .eq('year', currentYear)
        .eq('month', currentMonthNum)
        .eq('has_paid', true);
      if (tErr) throw tErr;

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

      // HEADCOUNT COUNTERS (1 O HIGIT PANG ATTENDANCE = PLUS 1 SA GROUP)
      let maGroup = 0, faGroup = 0, fyGroup = 0, myGroup = 0, msGroup = 0, fsGroup = 0;

      if (members) {
        members.forEach(m => {
          if (!VALID_AGE_GROUPS.includes(m.age_group)) return;

          const totalSessions = memberSessionsMap[m.id];
          const hasAttendedOnceOrMore = totalSessions >= 1;
          
          if (hasAttendedOnceOrMore) {
            count1X++; 
          }
          if (totalSessions >= 4) {
            count4X++; 
          }

          if (totalSessions === 0) {
            const firstName = m.full_name.split(' ')[0];
            zeroAttendanceList.push({ name: firstName, ageGroup: m.age_group });
          }

          // 🎯 EXACT MODULAR BOUNDARY AGGREGATION CORES (Laging magkabukod ang M at F)
          if (hasAttendedOnceOrMore) {
            const group = m.age_group;
            
            if (group === 'MA' || group === 'Male Elderly') {
              maGroup++;
            } else if (group === 'FA' || group === 'Female Elderly') {
              faGroup++;
            } else if (group === 'FY' || group === 'FW' || group === 'FU') {
              fyGroup++; // Female Youth / Female University / Female Worker
            } else if (group === 'MY' || group === 'MW' || group === 'MU') {
              myGroup++; // Male Youth / Male Worker / Male University
            } else if (group === 'Male High Sch' || group === 'Male Mid Sch' || group === 'MS') {
              msGroup++; // Male Secondary Sub-pools
            } else if (group === 'Female High Sch' || group === 'Female Mid Sch' || group === 'FS') {
              fsGroup++; // Female Secondary Sub-pools
            }
          }
        });

        // SORTING SYSTEM FOR ALERTS BOX
        zeroAttendanceList.sort((a, b) => {
          const orderA = AGE_SORT_ORDER[a.ageGroup] || 99;
          const orderB = AGE_SORT_ORDER[b.ageGroup] || 99;
          return orderA - orderB;
        });
      }

      setAttendanceMetrics({ count1X, count4X, totalTithes: validTithesCount });
      setGroupBreakdown({ ma: maGroup, fa: faGroup, fy: fyGroup, my: myGroup, ms: msGroup, fs: fsGroup });
      setNoAttendanceAlerts(zeroAttendanceList);

    } catch (err) {
      console.error("❌ ATTENDANCE_CARD: Error analyzing demographic headcounts:", err.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    calculateLiveAttendanceMetrics();
    const globalSyncTimer = setInterval(calculateLiveAttendanceMetrics, 10000);
    return () => clearInterval(globalSyncTimer);
  }, [userProfile?.zion_code]);

  // Helper function para makuha ang kasalukuyang linggo ng buwan (e.g., 1st, 2nd, 3rd, 4th, 5th)
const getOrdinalWeekOfMonth = () => {
  const now = new Date();
  const date = now.getDate();
  
  // Kalkulahin ang index ng linggo (1 hanggang 5)
  const weekIndex = Math.ceil(date / 7);
  
  // I-map ang numero sa kaukulang ordinal suffix
  const suffixes = ['st', 'nd', 'rd', 'th', 'th'];
  return `${weekIndex}${suffixes[weekIndex - 1] || 'th'}`;
};

  const currentWeek = getOrdinalWeekOfMonth();

  return (
    <View style={styles.container}>
      {/* CARD HEADER */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.primary} />
        <Text style={styles.title}>{`Attendance Update on ${currentWeek} Week`}</Text>
      </View>

      {/* SPLIT LAYOUT CONTAINER */}
      <View style={styles.sectionSplitWrapper}>
        
        {/* LEFT COMPONENT: ANALYTICS FRAMEWORK */}
        <View style={styles.matrixContainer}>
          {attendanceLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 35 }} />
          ) : (
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              
              {/* TOTAL NUMBERS GRID (HEARTBEAT SCALE EFFECT) */}
              <View style={styles.horizontalMetricsGrid}>
                
                <View style={styles.horizontalMetricBox}>
                  <Animated.Text style={[styles.bigMetricNumber, { color: COLORS.warning, transform: [{ scale: heartbeatAnim }] }]}>
                    {attendanceMetrics.count1X}
                  </Animated.Text>
                  <Text style={styles.metricLabelLegend}>1 Time Attendance</Text>
                </View>

                <View style={styles.horizontalMetricBox}>
                  <Animated.Text style={[styles.bigMetricNumber, { color: COLORS.primary, transform: [{ scale: heartbeatAnim }] }]}>
                    {attendanceMetrics.count4X}
                  </Animated.Text>
                  <Text style={styles.metricLabelLegend}>4 Times Attendance</Text>
                </View>

                <View style={[styles.horizontalMetricBox, { borderRightWidth: 0 }]}>
                  <Animated.Text style={[styles.bigMetricNumber, { color: COLORS.success, transform: [{ scale: heartbeatAnim }] }]}>
                    {attendanceMetrics.totalTithes}
                  </Animated.Text>
                  <Text style={styles.metricLabelLegend}>Tithes Participants</Text>
                </View>

              </View>

              {/* GROUP STATUS SEGMENT (KALIWANG GILID ANG TITLE) */}
              <View style={styles.groupBreakdownBadgeLine}>
                <Text style={styles.groupStatusLabel}>GROUP STATUS: </Text>
                <Text style={styles.badgeLineText}>
                  MA ({groupBreakdown.ma}) • FA ({groupBreakdown.fa}) • FY ({groupBreakdown.fy}) • MY ({groupBreakdown.my}) • MS ({groupBreakdown.ms}) • FS ({groupBreakdown.fs})
                </Text>
              </View>

            </View>
          )}
        </View>

        {/* RIGHT COMPONENT: NO ATTENDANCE ALERTS LIST */}
        <View style={[styles.alertContainer, !isAlertActive && { opacity: 0.5 }]}>
          <Text style={styles.alertCardHeadingText}>⚠️ NO ATTENDANCE</Text>
          {isAlertActive ? (
            <ScrollView style={styles.alertNamesContainerScroll} showsVerticalScrollIndicator={true}>
              {noAttendanceAlerts.length === 0 ? (
                <Text style={styles.allPresentCleanText}>All profiles active.</Text>
              ) : (
                noAttendanceAlerts.map((member, mIdx) => (
                  <Text key={mIdx} style={styles.alertMemberNameRowText}>
                    • {member.name} <Text style={{ color: COLORS.warning, fontSize: 8 }}>[{member.ageGroup}]</Text>
                  </Text>
                ))
              )}
            </ScrollView>
          ) : (
            <Text style={styles.waitingWeekText}>Monitoring window locked.</Text>
          )}
        </View>

      </View>
      
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
    marginBottom: 20,
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
    justifyContent: 'space-between',
  },
  horizontalMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
  },
  horizontalMetricBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#232329',
    paddingHorizontal: 2,
  },
  bigMetricNumber: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricLabelLegend: {
    color: COLORS.subtext,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
  },
  groupBreakdownBadgeLine: {
    borderTopWidth: 1,
    borderTopColor: '#232329',
    paddingTop: 8,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  groupStatusLabel: {
    color: COLORS.subtext,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgeLineText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    maxHeight: 105,
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
    marginVertical: 2.5,
    letterSpacing: 0.3,
  },
  waitingWeekText: {
    color: '#666',
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 25,
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