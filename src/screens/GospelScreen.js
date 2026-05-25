import React, { useState, useEffect, useRef } from 'react'; 
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// FIXED PATHS
import GospelCharts from '../components/GospelCharts'; 
import ActivityCard from '../components/ActivityCard';
import PreachingModal from '../components/PreachingModal'; 

// NEW IMPORTS FROM OWNACTIVITY
import EduLms from '../components/OwnActivity/EduLms';
import OnlineMission from '../components/OwnActivity/OnlineMission';
import Prayer from '../components/OwnActivity/Prayer';

// NEW IMPORTS FROM GROUPACTIVITY
import Sermon from '../components/GroupActivity/Sermon';
import ZionActivity from '../components/GroupActivity/ZionActivity';

// VERIFIED PATH: src/styles/theme.js
import { COLORS } from '../styles/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function GospelScreen() {
  const [showWeekly, setShowWeekly] = useState(true); // Default open para makita agad ang stats
  const [showCalendar, setShowCalendar] = useState(false);
  
  // MODAL STATES
  const [isPreachingOpen, setIsPreachingOpen] = useState(false);
  const [isSermonOpen, setIsSermonOpen] = useState(false);
  const [isZionActivityOpen, setIsZionActivityOpen] = useState(false);
  const [isEduLmsOpen, setIsEduLmsOpen] = useState(false);
  const [isOnlineMissionOpen, setIsOnlineMissionOpen] = useState(false);
  const [isPrayerOpen, setIsPrayerOpen] = useState(false);

  // ANNOUNCEMENT ANIMATION ENGINE
  const scrollX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    // Linear continuous loop animation matrix
    const startTicker = () => {
      scrollX.setValue(SCREEN_WIDTH);
      Animated.timing(scrollX, {
        toValue: -830, // Sapat na haba para sa buong haba ng string bago mag-reset
        duration: 20000, // 15 segundo para sa banayad at madaling basahing takbo
        easing: Easing.linear,
        useNativeDriver: true, // Optimized para sa UI thread hardware acceleration
      }).start(() => startTicker());
    };

    startTicker();
  }, [scrollX]);

  return (
    <View style={styles.mainWrapper}> 
      <ScrollView 
        style={styles.outerContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.responsiveWrapper}>

          {/* NEW: ANNOUNCEMENT TICKER BANNER (Nakalagay sa itaas ng Gospel Chart) */}
          <View style={styles.tickerContainer}>
            <View style={styles.tickerIconBadge}>
              <MaterialCommunityIcons name="bullhorn" size={14} color="#0f0f0f" />
            </View>
            <View style={styles.tickerTrack}>
              <Animated.View style={{ transform: [{ translateX: scrollX }] }}>
                <Text style={styles.tickerText}>
                  Mahalagang Paalala: Tiyakin na ang lahat ng naitala dito sa Gospel Tracker ay maire-record din sa inyong MyMemo App. ANIMO!
                </Text>
              </Animated.View>
            </View>
          </View>
          
          {/* ANALYTICS SECTION */}
          <View style={styles.chartSection}>
            
            {/* WEEKLY ROLLUP */}
            <TouchableOpacity 
              style={styles.rollupHeader} 
              onPress={() => setShowWeekly(!showWeekly)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.sectionTitle}>Weekly Monitoring</Text>
                {!showWeekly && <Text style={styles.percentageText}>Real-time Analytics</Text>}
              </View>
              <MaterialCommunityIcons 
                name={showWeekly ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            {showWeekly && (
              <View style={styles.chartWrapper}>
                <GospelCharts type="weekly" />
              </View>
            )}

            <View style={styles.divider} />

            {/* CALENDAR ROLLUP */}
            <TouchableOpacity 
              style={styles.rollupHeader} 
              onPress={() => setShowCalendar(!showCalendar)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.sectionTitle}>Activity Calendar</Text>
                {!showCalendar && <Text style={styles.percentageText}>Monthly Activity Hub</Text>}
              </View>
              <MaterialCommunityIcons 
                name={showCalendar ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>

            {showCalendar && (
              <View style={styles.chartWrapper}>
                <GospelCharts type="calendar" />
              </View>
            )}
          </View>

          {/* GROUP ACTIVITY GRID */}
          <Text style={styles.groupLabel}>GROUP ACTIVITY</Text>
          <View style={styles.cardGrid}>
            <ActivityCard 
              title="Preaching" 
              icon="bullhorn-variant" 
              color="#e74c3c" 
              onPress={() => setIsPreachingOpen(true)} 
            />
            <ActivityCard 
              title="Sermon" 
              icon="book-open-page-variant" 
              color="#f1c40f" 
              onPress={() => setIsSermonOpen(true)}
            />
            <ActivityCard 
              title="Zion Activity" 
              icon="office-building" 
              color="#4dabf7" 
              onPress={() => setIsZionActivityOpen(true)}
            />
          </View>

          {/* OWN ACTIVITY GRID */}
          <Text style={styles.groupLabel}>OWN ACTIVITY</Text>
          <View style={styles.cardGrid}>
            <ActivityCard 
              title="EduLMS" 
              icon="school" 
              color="#9b59b6" 
              onPress={() => setIsEduLmsOpen(true)}
            />
            <ActivityCard 
              title="Online Mission" 
              icon="earth" 
              color="#2ecc71" 
              onPress={() => setIsOnlineMissionOpen(true)}
            />
            <ActivityCard 
              title="Prayer" 
              icon="hands-pray" 
              color="#ecf0f1" 
              onPress={() => setIsPrayerOpen(true)}
            />
          </View>
          
        </View>
      </ScrollView>

      {/* --- MODAL CONNECTORS --- */}

      {/* Preaching Modal (Original) */}
      <PreachingModal 
        visible={isPreachingOpen} 
        onClose={() => setIsPreachingOpen(false)} 
      />

      {/* Sermon Modal */}
      <Modal visible={isSermonOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Sermon onClose={() => setIsSermonOpen(false)} />
             <TouchableOpacity style={styles.closeBtn} onPress={() => setIsSermonOpen(false)}>
                <Text style={styles.closeBtnText}>CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Zion Activity Modal */}
      <Modal visible={isZionActivityOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <ZionActivity onClose={() => setIsZionActivityOpen(false)} />
             <TouchableOpacity style={styles.closeBtn} onPress={() => setIsZionActivityOpen(false)}>
                <Text style={styles.closeBtnText}>CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EduLMS Modal */}
      <Modal visible={isEduLmsOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <EduLms onClose={() => setIsEduLmsOpen(false)} />
             <TouchableOpacity style={styles.closeBtn} onPress={() => setIsEduLmsOpen(false)}>
                <Text style={styles.closeBtnText}>CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Online Mission Modal */}
      <Modal visible={isOnlineMissionOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <OnlineMission onClose={() => setIsOnlineMissionOpen(false)} />
             <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOnlineMissionOpen(false)}>
                <Text style={styles.closeBtnText}>CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Prayer Modal */}
      <Modal visible={isPrayerOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Prayer onClose={() => setIsPrayerOpen(false)} />
             <TouchableOpacity style={styles.closeBtn} onPress={() => setIsPrayerOpen(false)}>
                <Text style={styles.closeBtnText}>CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#0f0f0f' },
  outerContainer: { flex: 1, backgroundColor: '#0f0f0f' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 15, paddingTop: 15, alignItems: 'center' },
  responsiveWrapper: { width: '100%', maxWidth: 550 },
  
  // NEW: ANNOUNCEMENT TICKER STYLES
  tickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    alignItems: 'center',
    height: 36
  },
  tickerIconBadge: {
    backgroundColor: '#26f7ff', // Premium Cyan contrast focal points
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tickerTrack: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  tickerText: {
    color: '#fff203',
    fontSize: 14,
    fontWeight: '700',
    whiteSpace: 'nowrap', // Para sa maayos na web compatibility framework rendering
  },

  chartSection: { 
    backgroundColor: '#1a1a1a', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222'
  },
  rollupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  percentageText: { color: COLORS?.primary || '#26f7ff', fontSize: 11, fontWeight: '600', marginTop: 2 },
  chartWrapper: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 15 },
  groupLabel: { color: COLORS?.primary || '#26f7ff', fontSize: 11, fontWeight: '900', marginVertical: 12, marginLeft: 5, letterSpacing: 1.5, opacity: 0.7 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '95%', maxWidth: 450, maxHeight: '90%', backgroundColor: '#0f0f0f', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  closeBtn: { backgroundColor: '#222', padding: 18, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333' },
  closeBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 2 }
});