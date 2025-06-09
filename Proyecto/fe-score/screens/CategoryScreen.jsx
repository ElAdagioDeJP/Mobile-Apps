import { useWindowDimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config'; // Asegúrate de que esta URL sea la de tu backend de Railway

export default function CategoryScreen({ route, navigation }) {
  const { key, label } = route.params;
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  const isAtletismo = key.startsWith('atletismo_');
  const isMaraton = key === 'atletismo_maraton';
  const isVelocidad = key === 'atletismo_velocidad';
  const isRelevo = key === 'atletismo_relevo';
  const isAjedrez = key.startsWith('ajedrez_');

  const positionsCount = isMaraton ? 8 : isVelocidad ? 4 : isRelevo ? 3 : 0;

  const [sections, setSections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codeA, setCodeA] = useState('');
  const [codeB, setCodeB] = useState('');
  const [positions, setPositions] = useState(Array(positionsCount).fill(''));
  const [gender, setGender] = useState('femenino');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Nuevo estado de autenticación

  // Función para obtener el encabezado de autenticación
  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('AUTH_HEADER');
    return token ? token : null; // Devuelve el token o null
  };

  // Verifica el estado de autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthHeader();
      setIsAuthenticated(!!token); // Si hay token, está autenticado
    };
    checkAuth();
  }, []);

  // Carga inicial de secciones
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/sections/${key}`);
        if (!res.ok) throw new Error('No se pudieron cargar las secciones');
        const data = await res.json();
        setSections(data);
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    })();
  }, [key]);

  // Guardar nueva sección
  const saveSection = async () => {
    if (!isAuthenticated) { // Evita la acción si no está autenticado
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para crear secciones.');
      return;
    }
    const payload = (isAtletismo || isAjedrez)
      ? { gender, ...(isAtletismo ? { positions: positions.map(p => p.toUpperCase()) } : {}) }
      : { codeA, codeB, scoreA: 0, scoreB: 0 };
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('No se pudo crear la sección');
      const created = await res.json();
      setSections(prev => [...prev, created]);
      resetForm();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Eliminar sección
  const deleteSection = async id => {
    if (!isAuthenticated) { // Evita la acción si no está autenticado
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para eliminar secciones.');
      return;
    }
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });
      if (res.status !== 204) throw new Error('No se pudo eliminar');
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Alternar estado "Finalizado"
  const toggleFinished = async sec => {
    if (!isAuthenticated) { // Evita la acción si no está autenticado
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para cambiar el estado de las secciones.');
      return;
    }
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${sec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ finished: !sec.finished }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      const updated = await res.json();
      setSections(prev => prev.map(s => (s.id === sec.id ? updated : s)));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Cambiar puntuación
  const changeScore = async (sec, side, delta) => {
    if (!isAuthenticated) { // Evita la acción si no está autenticado
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para modificar puntuaciones.');
      return;
    }
    if (sec.finished) { // No permitir cambios si el partido está finalizado
      Alert.alert('Partido Finalizado', 'No se pueden modificar las puntuaciones de un partido finalizado.');
      return;
    }

    const keyScore = side === 'A' ? 'scoreA' : 'scoreB';
    const newVal = Math.max(0, sec[keyScore] + delta);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${sec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ [keyScore]: newVal }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar score');
      const updated = await res.json();
      setSections(prev => prev.map(s => (s.id === sec.id ? updated : s)));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setCodeA('');
    setCodeB('');
    setPositions(Array(positionsCount).fill(''));
    setGender('femenino');
  };

  const renderPositions = (arr, disabled) => (
    <View style={styles.positionsContainer}>
      {arr.map((pos, idx) => (
        <View key={idx} style={styles.positionRowCenter}>
          <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
          <TextInput
            style={[
              styles.positionInputCenter,
              disabled && { opacity: 0.5 }
            ]}
            value={pos}
            editable={!disabled && isAuthenticated} // Editable solo si no está finalizado y autenticado
            onChangeText={t => { // Asegúrate de que esto actualice el estado si es editable
              if (!disabled && isAuthenticated) {
                // Lógica para actualizar la posición (necesitarías un handler para esto en Atletismo)
                // Para simplicidad, aquí solo actualizamos el estado local si el TextInput fuera parte del formulario de creación
                // Si necesitas que las posiciones sean editables DESPUÉS de la creación, la lógica sería más compleja
                // y requeriría una función `updatePosition` similar a `changeScore`.
                console.log(`Actualizando posición ${idx + 1} para atletismo a: ${t}`);
              }
            }}
          />
        </View>
      ))}
    </View>
  );

  const renderSection = ({ item }) => {
    const isMatchFinished = item.finished;
    const statusText = isMatchFinished ? 'FINALIZADO' : 'EN CURSO';
    const statusColor = isMatchFinished ? '#4CAF50' : '#FBBF09'; // Verde para finalizado, amarillo para en curso

    if (isAtletismo) {
      return (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.teamText}>Atletismo</Text>
            <View style={styles.iconGroup}>
              {isAuthenticated && ( // Solo muestra los botones si está autenticado
                <>
                  <TouchableOpacity onPress={() => toggleFinished(item)}>
                    <Icon
                      name={isMatchFinished ? 'flag' : 'flag-checkered'}
                      size={24}
                      color="#4CAF50"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
                    <Icon name="trash-can-outline" size={24} color="#F44336" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          {renderPositions(item.positions, isMatchFinished)}
          <View style={styles.genderRowCenter}>
            {/* Estos TouchableOpacity en renderSection deberían llamar a toggleFinished o ser solo visuales */}
            <View style={[styles.genderBtn, item.gender === 'femenino' && styles.genderSelected]}>
              <Icon
                name="gender-female"
                size={20}
                color={item.gender === 'femenino' ? '#2D529F' : '#FFF'}
              />
            </View>
            <View style={[styles.genderBtn, item.gender === 'masculino' && styles.genderSelected]}>
              <Icon
                name="gender-male"
                size={20}
                color={item.gender === 'masculino' ? '#2D529F' : '#FFF'}
              />
            </View>
          </View>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      );
    }

    if (isAjedrez) {
      return (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.teamText}>Ajedrez</Text>
            <View style={styles.iconGroup}>
              {isAuthenticated && ( // Solo muestra los botones si está autenticado
                <>
                  <TouchableOpacity onPress={() => toggleFinished(item)}>
                    <Icon
                      name={isMatchFinished ? 'flag' : 'flag-checkered'}
                      size={24}
                      color="#4CAF50"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
                    <Icon name="trash-can-outline" size={24} color="#F44336" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <View style={styles.genderRowCenter}>
            {/* Estos TouchableOpacity en renderSection deberían llamar a toggleFinished o ser solo visuales */}
            <View style={[styles.genderBtn, item.gender === 'femenino' && styles.genderSelected]}>
              <Icon
                name="gender-female"
                size={20}
                color={item.gender === 'femenino' ? '#2D529F' : '#FFF'}
              />
            </View>
            <View style={[styles.genderBtn, item.gender === 'masculino' && styles.genderSelected]}>
              <Icon
                name="gender-male"
                size={20}
                color={item.gender === 'masculino' ? '#2D529F' : '#FFF'}
              />
            </View>
          </View>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      );
    }

    // Default (equipos con score)
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.teamText}>{item.category}</Text>
          <View style={styles.iconGroup}>
            {isAuthenticated && ( // Solo muestra los botones si está autenticado
              <>
                <TouchableOpacity onPress={() => toggleFinished(item)}>
                  <Icon
                    name={isMatchFinished ? 'flag' : 'flag-checkered'}
                    size={24}
                    color="#4CAF50"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
                  <Icon name="trash-can-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Controles de puntuación */}
        <View style={styles.scoreRow}>
          <View style={styles.teamScoreContainer}>
            <Text style={styles.teamCode}>{item.codeA}</Text>
            {/* Botón para disminuir scoreA */}
            <TouchableOpacity
              onPress={() => changeScore(item, 'A', -1)}
              disabled={isMatchFinished || !isAuthenticated} // Deshabilitar si el partido ha terminado o no autenticado
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="minus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{item.scoreA}</Text>
            {/* Botón para aumentar scoreA */}
            <TouchableOpacity
              onPress={() => changeScore(item, 'A', 1)}
              disabled={isMatchFinished || !isAuthenticated} // Deshabilitar si el partido ha terminado o no autenticado
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="plus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.vsText}>vs</Text>

          <View style={styles.teamScoreContainer}>
            <Text style={styles.teamCode}>{item.codeB}</Text>
            {/* Botón para disminuir scoreB */}
            <TouchableOpacity
              onPress={() => changeScore(item, 'B', -1)}
              disabled={isMatchFinished || !isAuthenticated} // Deshabilitar si el partido ha terminado o no autenticado
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="minus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{item.scoreB}</Text>
            {/* Botón para aumentar scoreB */}
            <TouchableOpacity
              onPress={() => changeScore(item, 'B', 1)}
              disabled={isMatchFinished || !isAuthenticated} // Deshabilitar si el partido ha terminado o no autenticado
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="plus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    );
  };

  const validateCode = text =>
    text.toLowerCase().replace(/[^1-6abu]/g, '').slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left-bold" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label}</Text>
        {isAuthenticated && ( // Solo muestra el botón "+" si está autenticado
          <TouchableOpacity onPress={() => setShowForm(true)}>
            <Icon name="plus-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
        {!isAuthenticated && <View style={{ width: 28 }} />} {/* Espaciador si el botón "+" no está presente */}
      </View>

      <FlatList
        data={sections}
        keyExtractor={item => String(item.id)}
        renderItem={renderSection}
        contentContainerStyle={!sections.length && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Sin secciones aún</Text>}
      />

      <Modal visible={showForm} animationType="fade" transparent>
        <ScrollView contentContainerStyle={styles.modalBg}>
          <View style={[styles.modalBox, { width: width * 0.9 }]}>   
            <Text style={styles.modalTitle}>Crear Sección</Text>
            {(isAtletismo || isAjedrez) ? (
              <>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    onPress={() => setGender('femenino')}
                    style={[styles.genderBtn, gender === 'femenino' && styles.genderSelected]}
                  >
                    <Icon
                      name="gender-female"
                      size={24}
                      color={gender === 'femenino' ? '#2D529F' : '#FFF'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setGender('masculino')}
                    style={[styles.genderBtn, gender === 'masculino' && styles.genderSelected]}
                  >
                    <Icon
                      name="gender-male"
                      size={24}
                      color={gender === 'masculino' ? '#2D529F' : '#FFF'}
                    />
                  </TouchableOpacity>
                </View>
                {isAtletismo && positions.map((pos, idx) => (
                  <View key={idx} style={styles.positionRow}>
                    <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
                    <TextInput
                      placeholder={`${idx + 1}A`}
                      style={styles.positionInput}
                      value={positions[idx]}
                      onChangeText={t => setPositions(prev => {
                        const copy = [...prev];
                        copy[idx] = t.toUpperCase().slice(0, 2);
                        return copy;
                      })}
                      maxLength={2}
                    />
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="1A"
                  style={[styles.codeInput, { width: width * 0.3 }]}
                  value={codeA}
                  onChangeText={t => setCodeA(validateCode(t))}
                  maxLength={2}
                />
                <TextInput
                  placeholder="1B"
                  style={[styles.codeInput, { width: width * 0.3 }]}
                  value={codeB}
                  onChangeText={t => setCodeB(validateCode(t))}
                  maxLength={2}
                />
              </View>
            )}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSection}
                disabled={((isAtletismo || isAjedrez) ? !gender : !(codeA.length===2&&codeB.length===2)) || !isAuthenticated}
              >
                <Text style={[styles.saveText,((isAtletismo||isAjedrez)?!gender:!(codeA.length===2&&codeB.length===2))||!isAuthenticated && styles.disabled]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1D1B39' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, backgroundColor: '#2D529F', elevation: 4, paddingTop: Platform.OS === 'android' ? 24 : 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FBBF09' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#E8E8E8', fontSize: 18 },
  card: {
    backgroundColor: '#2D529F', margin: 12, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconGroup: { flexDirection: 'row', alignItems: 'center' },
  iconSpacing: { marginLeft: 16 },
  teamText: { fontSize: 22, fontWeight: '900', color: '#FBBF09', textTransform: 'uppercase', letterSpacing: 2 },
  positionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  positionRowCenter: { flexDirection: 'row', alignItems: 'center', margin: 4 },
  positionLabel: { width: 30, fontSize: 18, color: '#FBBF09' },
  positionInputCenter: {
    width: 50, borderWidth: 1, borderColor: '#FBBF09', borderRadius: 6,
    padding: Platform.OS==='android'?8:12, color: '#E8E8E8', fontSize: 16,
    fontWeight: '700', backgroundColor:'#1D1B39', textAlign:'center',
  },
  genderRowCenter: { flexDirection:'row', justifyContent:'center', marginTop:12 },
  genderBtn: { marginHorizontal:16, padding:10, borderRadius:50, borderWidth:1, borderColor:'#FBBF09' },
  genderSelected: { backgroundColor:'#FBBF09' },
  inputRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:20 },
  codeInput: {
    marginHorizontal:6, borderWidth:1, borderColor:'#FBBF09', borderRadius:6,
    padding:Platform.OS==='android'?8:12, color:'#E8E8E8', fontSize:16,
    fontWeight:'700', textAlign:'center', backgroundColor:'#2D529F',
  },
  actionsRow: { flexDirection:'row', justifyContent:'space-between', marginTop:20 },
  cancelText: { fontSize:18, color:'#E8E8E8' },
  saveText: { fontSize:18, fontWeight:'700', color:'#FBBF09' },
  disabled: { opacity: 0.5, color:'#777' }, // Estilo para elementos deshabilitados
  modalBg: { flexGrow:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center', paddingVertical:20 },
  modalBox: { backgroundColor:'#1D1B39', borderRadius:12, padding:24 },
  modalTitle: { fontSize:22, fontWeight:'800', marginBottom:20, textAlign:'center', color:'#FBBF09' },
  positionRow: { flexDirection:'row', alignItems:'center', marginBottom:8 },
  positionInput: {
    flex:1, borderWidth:1, borderColor:'#FBBF09', borderRadius:6,
    padding:Platform.OS==='android'?8:12, color:'#E8E8E8', fontSize:16,
    fontWeight:'700', backgroundColor:'#1D1B39', textAlign:'center',
  },
  genderRow: { flexDirection:'row', justifyContent:'center', marginBottom:20 },

  // --- NUEVOS ESTILOS PARA LA PUNTUACIÓN Y ESTADO ---
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10,
  },
  teamScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  teamCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FBBF09',
    marginRight: 10,
  },
  scoreBtn: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#1D1B39',
    marginHorizontal: 5,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginHorizontal: 10,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FBBF09',
    marginHorizontal: 10,
  },
  statusText: { // Nuevo estilo para el texto de estado
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  disabledBtn: {
    opacity: 0.3, // Para indicar que el botón está deshabilitado
  },
});