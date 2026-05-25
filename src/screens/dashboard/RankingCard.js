import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// MATERIAL DARK UI
const COLORS = {
  primary: '#26f7ff',
  card: '#121214',          
  itemBg: '#18181c',        
  text: '#ffffff',          
  subtext: '#a0a5b5',       
  silver: '#d1d4dc',        
  gold: '#f1c40f',
  rankCyan: '#26f7ff'
};

const RANK_ICONS = {
  1: require('../../../assets/1st_star.png'),
  2: require('../../../assets/2nd_star.png'),
  3: require('../../../assets/3rd_star.png'),
  4: require('../../../assets/4th_star.png'),
  5: require('../../../assets/5th_star.png'),
};

export default function RankingCard({ rankingData }) {
  
  const renderMember = ({ item, index }) => {
    const rank = index + 1;
    const hasStar = rank <= 5; 

    const memberName = item.user_name || 'Gospel Worker';
    const groupAge = item.group_age || item.groupAge || ''; 
    const preachPct = item.preach_pct ?? item.preachPct ?? '0';
    const activityPct = item.activity_pct ?? item.activityPct ?? '0';

    return (
      <View style={[styles.rankRow, rank === 1 && styles.topRankBorder]}>
        <View style={styles.leftInfo}>
          {/* Siksik na index area para iwas-tulak sa pangalan */}
          <Text style={styles.rankNumber}>{rank}</Text>
          
          <View style={styles.nameGroup}>
            {/* INAYOS NA WRAPPER: Patayo (Column) na para sa Pangalan at Age Profile kung siksikan */}
            <View style={styles.nameHeaderContainer}>
              <Text 
                style={styles.memberName} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {memberName}
              </Text>
              {groupAge !== '' && (
                <Text style={styles.groupAgeText} numberOfLines={1}>
                  • {groupAge}
                </Text>
              )}
            </View>
            
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Preach:</Text>
              <Text style={styles.statValue}>{preachPct}%</Text>
              <Text style={[styles.statLabel, {marginLeft: 8}]}>Activity:</Text>
              <Text style={styles.statValue}>{activityPct}%</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.rightInfo}>
          {hasStar ? (
            <Image source={RANK_ICONS[rank]} style={styles.starIcon} />
          ) : (
            <View style={{width: 18}} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="trophy-variant" size={18} color={COLORS.gold} />
          <Text style={styles.cardTitle}>Top Active Workers</Text>
        </View>
        <Text style={styles.subLabel}>The Top Gospel Worker this Week</Text>
        <Text style={styles.updateNote}>Updates: Every Friday 11:59PM</Text>
      </View>

      <FlatList
        data={rankingData?.slice(0, 10)} 
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderMember}
        scrollEnabled={true} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="timer-sand" size={30} color="#444" />
            <Text style={styles.emptyText}>Calculating weekly rankings...</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 12, // Pinaliit mula 15 para lumaki ang workspace ng listahan
    borderWidth: 1,
    borderColor: '#232329', 
    height: '100%',
    flex: 1,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  subLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  updateNote: {
    color: COLORS.subtext, 
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.itemBg,
    paddingVertical: 10, 
    paddingHorizontal: 8, // Ginawang 8 mula 10 para lumuwag pa ang pinakagitna
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#25252b', 
  },
  topRankBorder: {
    borderColor: COLORS.primary + '55', 
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
  },
  rankNumber: {
    color: COLORS.rankCyan,
    fontSize: 14, 
    fontWeight: '900',
    width: 16, // Pinaliit mula 18 upang isagad ang lunas sa spacing
    textAlign: 'center'
  },
  nameGroup: {
    marginLeft: 6, 
    flex: 1, 
  },
  nameHeaderContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    // UI FIXED GABAY: Tinanggal ang flexWrap para hindi mag-collapse ang text modules sa mobile web layouts
    flex: 1,
  },
  memberName: {
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: 'bold',
    // Binigyan ng malaking flex allocation para lumabas ang unang 4-8 na karakter bago mag-truncate
    flexGrow: 2,
    flexShrink: 1, 
  },
  groupAgeText: {
    color: COLORS.silver, 
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4,
    flexShrink: 2, // Mas mabilis itong mapuputol kumpara sa memberName para protektahan ang pangalan
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 2,
    alignItems: 'center'
  },
  statLabel: {
    color: COLORS.subtext, 
    fontSize: 8,
    fontWeight: 'bold',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
    marginLeft: 1,
  },
  rightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 20, // Pinaliit mula 24 para hindi nakaw-espasyo sa pangalan ng worker
    marginLeft: 2,
  },
  starIcon: {
    width: 18, 
    height: 18,
    resizeMode: 'contain',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: COLORS.subtext, 
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center'
  }
});