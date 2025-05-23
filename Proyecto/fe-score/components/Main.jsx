import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
  primary: '#6C5CE7',
  secondary: '#00B894',
  accent: '#0984E3',
  light: '#F0F4F8',
  greyBg: '#ECEFF1',
  greyText: '#7F8FA6'
};

export const categories = [
  { key: 'futbol', label: 'Fútbol', icon: 'soccer', color: COLORS.primary },
  { key: 'baloncesto', label: 'Baloncesto', icon: 'basketball', color: COLORS.secondary },
  { key: 'ajedrez', label: 'Ajedrez', icon: 'chess-knight', color: COLORS.accent },
  { key: 'voleibol', label: 'Voleibol', icon: 'volleyball', color: '#FD79A8' },
  { key: 'atletismo', label: 'Atletismo', icon: 'run', color: '#E17055' },
];


const Main = ({ navigation }) => (
  <SafeAreaView style={styles.safe}>
    <ScrollView style={styles.container}>

      <Text style={styles.header}>La Fe Score</Text>

      <View style={styles.searchWrapper}>
        <Icon name="magnify" size={20} color={COLORS.greyText} />
        <TextInput
          placeholder="Buscar competiciones"
          placeholderTextColor={COLORS.greyText}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map(cat => (
          <TouchableOpacity key={cat.key} style={[styles.catButton, { backgroundColor: cat.color + '20' }]} onPress={() => navigation.navigate('Category', { key: cat.key, label: cat.label })}>
            <Icon name={cat.icon} size={24} color={cat.color} />
            <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.light
  },
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.primary
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 20,
    // sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // sombra Android
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333'
  },

  categories: {
    marginBottom: 28
  },
  catButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // sutil sombra
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    })
  },
  catLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600'
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },

  card: {
    width: 210,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 16,
    // sombra bajo la tarjeta
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      }
    })
  },
  cardImage: {},
  cardTextBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 10
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  cardTime: {
    color: '#EEE',
    fontSize: 12,
    marginTop: 2
  },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: COLORS.greyBg,
    paddingVertical: 10,
    justifyContent: 'space-around',
    backgroundColor: '#FFF'
  },
  tabButton: {
    alignItems: 'center'
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.greyText,
    marginTop: 2
  }
});

export default Main;
