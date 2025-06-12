import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
  primary: '#6C5CE7',
  secondary: '#00B894',
  accent: '#0984E3',
  light: '#FFFFFF',
  greyText: '#F1F1F1',
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
        <Image
          source={require('../assets/logo.png')}
          style={{ width: 200, height: 63, alignSelf: 'center', marginBottom: 16, marginTop: 16 }}
        ></Image>
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
    backgroundColor: '#1D1B39',  // Fondo oscuro premium
    padding: 16
  },
  headerContainer: {
    marginBottom: 16,
    backgroundColor: '#1D1B39',  // Azul intenso para el encabezado
    borderRadius: 12,
    padding: 16,
    marginTop: Platform.OS === 'android' ? 18 : 0, // Espacio para la barra de estado en Android
    // Sombra premium
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',  // Más grueso para mayor impacto
    color: '#FBBF09',   // Dorado premium
    marginBottom: 8,
    letterSpacing: 0.5, // Mejor espaciado
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D529F',  // Azul intenso
    borderRadius: 20,
    paddingHorizontal: 16,       // Más espaciado
    height: 48,                 // Altura aumentada
    borderWidth: 1,             // Borde dorado
    borderColor: '#FBBF09',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,             // Más espaciado
    fontSize: 16,               // Tamaño aumentado
    color: '#E8E8E8',           // Texto claro
    fontWeight: '600'
  },
  list: {
    justifyContent: 'space-between'
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 12,           // Bordes más redondeados
    paddingVertical: 24,        // Más espaciado vertical
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D529F', // Fondo azul premium
    // Sombra mejorada
  },
  cardLabel: {
    marginTop: 12,              // Más espaciado
    fontSize: 16,
    fontWeight: '700',          // Más grueso
    color: '#FBBF09',           // Dorado premium
  }
});
export default Main;