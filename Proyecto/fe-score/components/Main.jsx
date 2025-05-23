import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
  primary: '#6C5CE7',
  secondary: '#00B894',
  accent: '#0984E3',
  light: '#FFFFFF',
  greyText: '#7F8FA6',
  greyBg: '#F7F7F7'
};

// Cada categoría repetida usa el mismo key, diferenciamos género al navegar
export const categories = [
  { key: 'futbol', label: 'Fútbol', icon: 'soccer', color: COLORS.accent },
  { key: 'beisbol5', label: 'Béisbol 5', icon: 'baseball', color: COLORS.primary },
  { key: 'basketball', label: 'Basketball', icon: 'basketball', color: COLORS.secondary },
  { key: 'futenis', label: 'Futénis', icon: 'table-tennis', color: COLORS.primary },
  { key: 'atletismo_velocidad', label: 'Atletismo-Velocidad', icon: 'run-fast', color: COLORS.accent },
  { key: 'atletismo_maraton', label: 'Atletismo-Maratón', icon: 'run', color: COLORS.accent },
  { key: 'atletismo_relevo', label: 'Atletismo-Relevo', icon: 'trackpad', color: COLORS.accent },
  { key: 'vuelo_avion', label: 'Vuelo de Avión', icon: 'airplane', color: COLORS.accent },
  { key: 'voleibol', label: 'Voleibol', icon: 'volleyball', color: COLORS.primary },
  { key: 'kickingball', label: 'Kickingball', icon: 'soccer-field', color: COLORS.primary },
  { key: 'balonmano', label: 'Balonmano', icon: 'handball', color: COLORS.secondary },
  { key: 'ajedrez', label: 'Ajedrez', icon: 'chess-knight', color: COLORS.secondary }
];

const Main = ({ navigation }) => {
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.color + '20' }]}
      onPress={() => navigation.navigate('Category', { key: item.key, label: item.label })}
    >
      <Icon name={item.icon} size={32} color={item.color} />
      <Text style={[styles.cardLabel, { color: item.color }]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>La Fe Score</Text>
        <View style={styles.searchWrapper}>
          <Icon name="magnify" size={20} color={COLORS.greyText} />
          <TextInput
            placeholder="Buscar competiciones"
            placeholderTextColor={COLORS.greyText}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.key}
        renderItem={renderCategory}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 16
  },
  headerContainer: {
    marginBottom: 16
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 8
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  list: {
    justifyContent: 'space-between'
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // sombra más marcada
    
  },
  cardLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default Main;
