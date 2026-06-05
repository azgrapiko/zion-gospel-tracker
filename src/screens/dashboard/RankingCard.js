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
  
  const activeCurrentMonthString = new Date().toISOString().substring(0, 7); // Format: YYYY-MM

  // ISOLATION AND SORTING ENGINE: Isinasagawa ang tamang pag-sort base sa pinagsamang performance score
  const isolatedMonthlyRankings = React.useMemo(() => {
    if (!Array.isArray(rankingData)) return [];
    
    return [...rankingData]
      .filter(item => {
        if (item.log_month) return item.log_month === activeCurrentMonthString;
        if (item.log_date) return item.log_date.substring(0, 7) === activeCurrentMonthString;
        return true; 
      })
      .sort((a, b) => {
        // Kumuha ng numerical values para sa ligtas na kalkulasyon
        const aPreach = Number(a.preach_pct ?? a.preachPct ?? 0);
        const aActivity = Number(a.activity_pct ?? a.activityPct ?? 0);
        const bPreach = Number(b.preach_pct ?? b.preachPct ?? 0);
        const bActivity = Number(b.activity_pct ?? b.activityPct ?? 0);

        // FORMULA MATRICES: Pagsamahin ang dalawang indicators para sa kabuuang score ng sipag
        const totalScoreA = aPreach + aActivity;
        const totalScoreB = bPreach + bActivity;

        if (totalScoreB !== totalScoreA) {
          return totalScoreB - totalScoreA; // Unahin ang may mas mataas na pinagsamang porsyento
        }
        // Kung patas, unahin ang may mas mataas na Preach Percentage partikularly
        return bPreach - aPreach;
      })
      .slice(0, 10);
  }, [rankingData, activeCurrentMonthString]);

  const renderMember = ({ item, index }) => {
    const rank = index + 1;
    const hasStar = rank <= 5; 

    const memberName = item.user_name || item.full_name || 'Gospel Worker';
    const groupAge = item.group_age || item.groupAge || ''; 
    const preachPct = item.preach_pct ?? item.preachPct ?? '0';
    const activityPct = item.activity_pct ?? item.activityPct ?? '0';

    return (
      <View style={[styles.rankRow, rank === 1 && styles.topRankBorder]}>
        <View style={styles.leftInfo}>
          <Text style={styles.rankNumber}>{rank}</Text>
          
          <View style={styles.nameGroup}>
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
        <Text style={styles.subLabel}>The Top Gospel Worker this Month</Text>
        <Text style={styles.updateNote}>Updates: Live Sync Engine Matrix</Text>
      </View>

      <FlatList
        data={isolatedMonthlyRankings} 
        keyExtractor={(item, index) => item.id?.toString() || item.uniqueKey || index.toString()}
        renderItem={renderMember}
        scrollEnabled={true} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="timer-sand" size={30} color="#444" />
            <Text style={styles.emptyText}>Calculating isolated monthly rankings...</Text>
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
    padding: 12, 
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
    paddingHorizontal: 8, 
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
    width: 16, 
    textAlign: 'center'
  },
  nameGroup: {
    marginLeft: 6, 
    flex: 1, 
  },
  nameHeaderContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: 'bold',
    flexGrow: 2,
    flexShrink: 1, 
  },
  groupAgeText: {
    color: COLORS.silver, 
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4,
    flexShrink: 2, 
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
    width: 20, 
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