import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  Modal 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// PHASE 3 FIX: Inayos ang lahat ng asset paths mula ../../ patungong ../../../
const AVATAR_LIST = [
  { id: 'm1', name: 'man1', source: require('../../../assets/man1.png') },
  { id: 'm2', name: 'man2', source: require('../../../assets/man2.png') },
  { id: 'm3', name: 'man3', source: require('../../../assets/man3.png') },
  { id: 'm4', name: 'man4', source: require('../../../assets/man4.png') },
  { id: 'm5', name: 'man5', source: require('../../../assets/man5.png') },
  { id: 'm6', name: 'man6', source: require('../../../assets/man6.png') },
  { id: 'm7', name: 'man7', source: require('../../../assets/man7.png') },
  { id: 'm8', name: 'man8', source: require('../../../assets/man8.png') },
  { id: 'm9', name: 'man9', source: require('../../../assets/man9.png') },
  { id: 'm10', name: 'man10', source: require('../../../assets/man10.png') },
  { id: 'm11', name: 'man11', source: require('../../../assets/man11.png') },
  { id: 'm12', name: 'man12', source: require('../../../assets/man12.png') },
  { id: 'w1', name: 'woman1', source: require('../../../assets/woman1.png') },
  { id: 'w2', name: 'woman2', source: require('../../../assets/woman2.png') },
  { id: 'w3', name: 'woman3', source: require('../../../assets/woman3.png') },
  { id: 'w4', name: 'woman4', source: require('../../../assets/woman4.png') },
  { id: 'w5', name: 'woman5', source: require('../../../assets/woman5.png') },
  { id: 'w6', name: 'woman6', source: require('../../../assets/woman6.png') },
  { id: 'w7', name: 'woman7', source: require('../../../assets/woman7.png') },
  { id: 'w8', name: 'woman8', source: require('../../../assets/woman8.png') },
  { id: 'w9', name: 'woman9', source: require('../../../assets/woman9.png') },
  { id: 'w10', name: 'woman10', source: require('../../../assets/woman10.png') },
  { id: 'w11', name: 'woman11', source: require('../../../assets/woman11.png') },
  { id: 'w12', name: 'woman12', source: require('../../../assets/woman12.png') },
  { id: 'w13', name: 'woman13', source: require('../../../assets/woman13.png') },
  { id: 'w14', name: 'woman14', source: require('../../../assets/woman14.png') },
  { id: 'w15', name: 'woman15', source: require('../../../assets/woman15.png') },
  { id: 'w16', name: 'woman16', source: require('../../../assets/woman16.png') },
  { id: 'w17', name: 'woman17', source: require('../../../assets/woman17.png') },
  { id: 'w18', name: 'woman18', source: require('../../../assets/woman18.png') },
  { id: 't1', name: 'teacher1', source: require('../../../assets/teacher1.png') },
  { id: 't2', name: 'teacher2', source: require('../../../assets/teacher2.png') },
  { id: 't3', name: 'teacher3', source: require('../../../assets/teacher3.png') },
];

export default function AvatarPicker({ visible, onClose, onSelect }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>CHOOSE YOUR AVATAR</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close-circle" size={28} color="#ff4d4d" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={AVATAR_LIST}
            numColumns={4}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.avatarWrapper} 
                onPress={() => onSelect(item.source)}
              >
                <Image source={item.source} style={styles.avatarImage} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '90%',
    height: '70%',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5
  },
  title: {
    color: '#26f7ff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  listContent: {
    alignItems: 'center',
    paddingBottom: 20
  },
  avatarWrapper: {
    margin: 8,
    padding: 5,
    backgroundColor: '#222',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatarImage: {
    width: 65,
    height: 65,
    borderRadius: 10
  }
});