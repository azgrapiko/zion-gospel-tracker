import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * ActivityCard Component
 * @param {string} title - Pangalan ng activity (e.g., SERMON, PRAYER)
 * @param {string} icon - MaterialCommunityIcons name
 * @param {string} color - Accent color para sa border at icon
 * @param {function} onPress - Trigger function para sa modal o navigation
 */
export default function ActivityCard({ title, icon, color, onPress }) {
  return (
    <TouchableOpacity 
      style={[styles.card, { borderTopColor: color || '#26f7ff' }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Subtle indicator sa gilid para sa premium look */}
      <View style={[styles.dot, { backgroundColor: color || '#26f7ff' }]} />

      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={28} color={color || '#26f7ff'} />
      </View>
      
      {/* MATERIAL DARK UI UI-FIX: Pure white at pinalakas ang bold hierarchy para madaling makita ng matatanda */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
      
      {/* Visual bottom accent para sa symmetry */}
      <View style={styles.bottomAccent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#121214', // Iniahon mula #1a1a1a para sa tamang material surface contrast elevation
    width: '31.5%', 
    paddingVertical: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 15, 
    borderWidth: 1,
    borderColor: '#232329', // Mas matingkad na border perimeter kumpara sa lumang translucent alpha color
    borderTopWidth: 3, 
    // Shadow/Elevation para sa depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  iconContainer: {
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: { 
    color: '#ffffff', // High-contrast solid pure white mula #e0e0e0 upang hindi sumakit ang mata ng adults
    fontSize: 9, 
    textAlign: 'center', 
    fontWeight: '900', // Ginawang ultra-bold mula sa 800 para sa lumilitaw na text-shaping
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 5
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6 // Bahagyang itinaas mula 0.5 para sa mas magandang premium accent dot visibility
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  }
});