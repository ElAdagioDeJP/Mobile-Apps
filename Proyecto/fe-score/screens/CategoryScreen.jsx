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
import { API_URL } from '../config';

export default function CategoryScreen({ route, navigation }) {
  const { key, label } = route.params;
  const { width } = useWindowDimensions();

  // --- Identificación de Categorías Especiales ---
  const isAtletismo = key.startsWith('atletismo_');
  const isMaraton = key === 'atletismo_maraton';
  const isVelocidad = key === 'atletismo_velocidad';
  const isRelevo = key === 'atletismo_relevo';
  const isAjedrez = key === 'ajedrez';
  const isAvion = key === 'vuelo_avion';
  
  // --- Lógica de Posiciones ---
  // Vuelo de avión: 2 posiciones (1ro Masc, 1ro Fem)
  // Ajedrez: 4 posiciones (1ro Masc, 2do Masc, 1ro Fem, 2do Fem)
  const positionsCount = isMaraton
    ? 8
    : isVelocidad
      ? 4
      : isRelevo
        ? 3
        : isAvion
          ? 2
          : isAjedrez
            ? 4
            : 0; 

  const [sections, setSections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codeA, setCodeA] = useState('');
  const [codeB, setCodeB] = useState('');
  const [positions, setPositions] = useState(Array(positionsCount).fill(''));
  const [gender, setGender] = useState('femenino');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Funciones de Autenticación y API ---
  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('AUTH_HEADER');
    return token || null;
  };

  useEffect(() => {
    (async () => {
      const token = await getAuthHeader();
      setIsAuthenticated(!!token);
    })();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch(`${API_URL}/sections/${key}`);
        if (!res.ok) throw new Error('No se pudieron cargar las secciones');
        const data = await res.json();
        setSections(data);
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    };
    fetchSections();
  }, [key]);

  const saveSection = async () => {
    if (!isAuthenticated) {
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para crear secciones.');
      return;
    }

    let payload;
    if (isAtletismo || isAjedrez || isAvion) {
      // Unificamos el payload para categorías basadas en posiciones
      payload = { positions: positions.map(p => p.toUpperCase()) };
      // Añadimos 'gender' solo si es atletismo (no ajedrez ni avión)
      if (isAtletismo) {
        payload.gender = gender;
      }
    } else {
      payload = { codeA, codeB, scoreA: 0, scoreB: 0 };
    }

    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'No se pudo crear la sección');
      }
      const created = await res.json();
      setSections(prev => [...prev, created]);
      resetForm();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };
  
  const deleteSection = async id => {
    if (!isAuthenticated) {
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para eliminar secciones.');
      return;
    }
    
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });
      
      if (res.status !== 204) {
        throw new Error('No se pudo eliminar la sección');
      }
      
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const toggleFinished = async sec => {
    if (!isAuthenticated) return Alert.alert('Acceso Denegado', 'Debes iniciar sesión para cambiar el estado.');
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
  
  const changeScore = async (sec, side, delta) => {
    if (!isAuthenticated) return Alert.alert('Acceso Denegado', 'Debes iniciar sesión para modificar puntuaciones.');
    if (sec.finished) return Alert.alert('Partido Finalizado', 'No se pueden modificar las puntuaciones.');
    
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

  // --- Funciones Auxiliares y de Renderizado ---
  const resetForm = () => {
    setShowForm(false);
    setCodeA('');
    setCodeB('');
    setPositions(Array(positionsCount).fill(''));
    setGender('femenino');
  };

  const validateCode = text => text.toUpperCase().replace(/[^1-6ABU]/g, '').slice(0, 2);

  const renderPositions = (arr) => (
    <View style={styles.positionsContainer}>
      {arr.map((pos, idx) => (
        <View key={idx} style={styles.positionRowCenter}>
          <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
          <TextInput
            style={[styles.positionInputCenter, { opacity: 0.7 }]}
            value={pos}
            editable={false}
          />
        </View>
      ))}
    </View>
  );

  const renderSection = ({ item }) => {
    const isMatchFinished = item.finished;
    const statusText = isMatchFinished ? 'FINALIZADO' : 'EN CURSO';
    const statusColor = isMatchFinished ? '#4CAF50' : '#FBBF09';

    // === Categoría Vuelo de Avión y Ajedrez ===
    if (isAvion || isAjedrez) {
      const isChess = key === 'ajedrez';
      // Mapeo de posiciones para facilitar el renderizado
      // Ajedrez: [0: 1M, 1: 2M, 2: 1F, 3: 2F]
      // Avión:   [0: 1M, 1: 1F]
      const malePositions = isChess ? [item.positions[0], item.positions[1]] : [item.positions[0]];
      const femalePositions = isChess ? [item.positions[2], item.positions[3]] : [item.positions[1]];
      
      return (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.teamText}>{label}</Text>
            {isAuthenticated && (
              <View style={styles.iconGroup}>
                <TouchableOpacity onPress={() => toggleFinished(item)}>
                  <Icon name={item.finished ? 'flag' : 'flag-checkered'} size={24} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
                  <Icon name="trash-can-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
          </View>
    
          <View style={styles.resultsContainer}>
            {/* Columna Masculina */}
            <View style={styles.genderColumn}>
               <Icon name="gender-male" size={32} color="#FBBF09" style={styles.genderIcon}/>
               {malePositions.map((pos, index) => (
                 <View key={`male-${index}`} style={styles.resultItem}>
                   <Text style={styles.resultIndex}>{index + 1}° Lugar</Text>
                   <View style={styles.resultBox}>
                     <Text style={styles.resultCode}>{pos}</Text>
                   </View>
                 </View>
               ))}
            </View>
            {/* Columna Femenina */}
            <View style={styles.genderColumn}>
                <Icon name="gender-female" size={32} color="#FBBF09" style={styles.genderIcon}/>
                {femalePositions.map((pos, index) => (
                 <View key={`female-${index}`} style={styles.resultItem}>
                   <Text style={styles.resultIndex}>{index + 1}° Lugar</Text>
                   <View style={styles.resultBox}>
                     <Text style={styles.resultCode}>{pos}</Text>
                   </View>
                 </View>
               ))}
            </View>
          </View>
    
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      );
    }
    
    // === Atletismo ===
    if (isAtletismo) {
      return (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.teamText}>{label}</Text>
            {isAuthenticated && (
              <View style={styles.iconGroup}>
                <TouchableOpacity onPress={() => toggleFinished(item)}>
                  <Icon name={isMatchFinished ? 'flag' : 'flag-checkered'} size={24} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
                  <Icon name="trash-can-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {renderPositions(item.positions)}
          <View style={styles.genderRowCenter}>
            <View style={[styles.genderBtn, { backgroundColor: item.gender === 'femenino' ? '#FBBF09' : 'transparent' }]}>
              <Icon name="gender-female" size={20} color={item.gender === 'femenino' ? '#2D529F' : '#FFF'} />
            </View>
            <View style={[styles.genderBtn, { backgroundColor: item.gender === 'masculino' ? '#FBBF09' : 'transparent' }]}>
              <Icon name="gender-male" size={20} color={item.gender === 'masculino' ? '#2D529F' : '#FFF'} />
            </View>
          </View>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      );
    }

    // === Resto de categorías con puntuación ===
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.teamText}>{label}</Text>
          {isAuthenticated && (
            <View style={styles.iconGroup}>
              <TouchableOpacity onPress={() => toggleFinished(item)}>
                <Icon name={isMatchFinished ? 'flag' : 'flag-checkered'} size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
                <Icon name="trash-can-outline" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.codeRow}>
          <Text style={styles.teamCode}>{item.codeA}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.teamCode}>{item.codeB}</Text>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.teamScoreContainer}>
            <TouchableOpacity onPress={() => changeScore(item, 'A', -1)} disabled={isMatchFinished || !isAuthenticated} style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}>
              <Icon name="minus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{item.scoreA}</Text>
            <TouchableOpacity onPress={() => changeScore(item, 'A', 1)} disabled={isMatchFinished || !isAuthenticated} style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}>
              <Icon name="plus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.vsText}></Text>
          <View style={styles.teamScoreContainer}>
            <TouchableOpacity onPress={() => changeScore(item, 'B', -1)} disabled={isMatchFinished || !isAuthenticated} style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}>
              <Icon name="minus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{item.scoreB}</Text>
            <TouchableOpacity onPress={() => changeScore(item, 'B', 1)} disabled={isMatchFinished || !isAuthenticated} style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}>
              <Icon name="plus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    );
  };
  
  // --- Componente Principal ---
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left-bold" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label}</Text>
        {isAuthenticated ? (
          <TouchableOpacity onPress={() => setShowForm(true)}>
            <Icon name="plus-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <FlatList
        data={sections}
        keyExtractor={item => String(item.id)}
        renderItem={renderSection}
        contentContainerStyle={!sections.length && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Sin secciones aún</Text>}
      />

      {/* --- Modal de Creación --- */}
      <Modal visible={showForm} animationType="fade" transparent>
        <ScrollView contentContainerStyle={styles.modalBg} keyboardShouldPersistTaps="handled">
          <View style={[styles.modalBox, { width: width * 0.9 }]}>
            <Text style={styles.modalTitle}>Crear Sección</Text>

            {isAvion || isAjedrez ? (
              <>
                <Text style={styles.subTitle}>Ingresa los Ganadores</Text>
                <View style={styles.formColumnsContainer}>
                  {/* Columna Masculino */}
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Masculino</Text>
                    <TextInput
                      placeholder="1er Lugar"
                      style={styles.positionInputForm}
                      value={positions[0]}
                      onChangeText={t => setPositions(p => { const c = [...p]; c[0] = validateCode(t); return c; })}
                      maxLength={2}
                    />
                    {isAjedrez && (
                      <TextInput
                        placeholder="2do Lugar"
                        style={styles.positionInputForm}
                        value={positions[1]}
                        onChangeText={t => setPositions(p => { const c = [...p]; c[1] = validateCode(t); return c; })}
                        maxLength={2}
                      />
                    )}
                  </View>
                   {/* Columna Femenino */}
                  <View style={styles.formColumn}>
                     <Text style={styles.formLabel}>Femenino</Text>
                    <TextInput
                      placeholder="1er Lugar"
                      style={styles.positionInputForm}
                      value={isAjedrez ? positions[2] : positions[1]}
                      onChangeText={t => setPositions(p => {
                        const c = [...p];
                        c[isAjedrez ? 2 : 1] = validateCode(t);
                        return c;
                      })}
                      maxLength={2}
                    />
                     {isAjedrez && (
                      <TextInput
                        placeholder="2do Lugar"
                        style={styles.positionInputForm}
                        value={positions[3]}
                        onChangeText={t => setPositions(p => { const c = [...p]; c[3] = validateCode(t); return c; })}
                        maxLength={2}
                      />
                    )}
                  </View>
                </View>
              </>
            ) : isAtletismo ? (
              <>
                <View style={styles.genderRow}>
                  <TouchableOpacity onPress={() => setGender('femenino')} style={[styles.genderBtnModal, gender === 'femenino' && styles.genderSelected]}>
                    <Icon name="gender-female" size={24} color={gender === 'femenino' ? '#2D529F' : '#FFF'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setGender('masculino')} style={[styles.genderBtnModal, gender === 'masculino' && styles.genderSelected]}>
                    <Icon name="gender-male" size={24} color={gender === 'masculino' ? '#2D529F' : '#FFF'} />
                  </TouchableOpacity>
                </View>
                <View>
                  {positions.map((_, idx) => (
                    <View key={idx} style={styles.positionRow}>
                      <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
                      <TextInput
                        placeholder={`Ej: ${idx + 1}A`}
                        style={styles.positionInput}
                        value={positions[idx]}
                        onChangeText={t => setPositions(p => { const c = [...p]; c[idx] = validateCode(t); return c; })}
                        maxLength={2}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.inputRow}>
                <TextInput placeholder="1A" style={[styles.codeInput, { width: width * 0.3 }]} value={codeA} onChangeText={t => setCodeA(validateCode(t))} maxLength={2} />
                <TextInput placeholder="1B" style={[styles.codeInput, { width: width * 0.3 }]} value={codeB} onChangeText={t => setCodeB(validateCode(t))} maxLength={2} />
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={resetForm}><Text style={styles.cancelText}>Cerrar</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveSection} disabled={!isAuthenticated}>
                <Text style={[styles.saveText, !isAuthenticated && styles.disabled]}>Guardar</Text>
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
    padding: 14, backgroundColor: '#2D529F', elevation: 4,
    paddingTop: Platform.OS === 'android' ? 24 : 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FBBF09' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#E8E8E8', fontSize: 18 },
  card: {
    backgroundColor: '#2D529F', margin: 12, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, elevation: 2,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12
  },
  iconGroup: { flexDirection: 'row', alignItems: 'center' },
  iconSpacing: { marginLeft: 16 },
  teamText: {
    fontSize: 22, fontWeight: '900', color: '#FBBF09',
    textTransform: 'uppercase', letterSpacing: 1
  },
  codeRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', marginVertical: 4
  },
  positionsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'
  },
  positionRowCenter: {
    flexDirection: 'row', alignItems: 'center', margin: 4
  },
  positionLabel: { width: 30, fontSize: 18, color: '#FBBF09', fontWeight:'bold' },
  positionInputCenter: {
    width: 50, borderWidth: 1, borderColor: '#FBBF09', borderRadius: 6,
    padding: Platform.OS === 'android' ? 6 : 10,
    color: '#E8E8E8', fontSize: 16, fontWeight: '700',
    backgroundColor: '#1D1B39', textAlign: 'center'
  },
  genderRowCenter: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 12
  },
  genderBtn: {
    marginHorizontal: 16, padding: 10, borderRadius: 50,
    borderWidth: 1, borderColor: '#FBBF09'
  },
  inputRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20
  },
  codeInput: {
    marginHorizontal: 6, borderWidth: 1, borderColor: '#FBBF09', borderRadius: 6,
    padding: Platform.OS === 'android' ? 8 : 12,
    color: '#E8E8E8', fontSize: 16, fontWeight: '700',
    textAlign: 'center', backgroundColor: '#1D1B39'
  },
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, borderTopWidth:1, borderTopColor: '#2D529F', paddingTop: 15
  },
  cancelText: { fontSize: 18, color: '#E8E8E8', fontWeight:'600' },
  saveText: { fontSize: 18, fontWeight: '700', color: '#FBBF09' },
  disabled: { opacity: 0.5 },
  modalBg: {
    flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', paddingVertical: 20
  },
  modalBox: { backgroundColor: '#1D1B39', borderRadius: 12, padding: 24, borderWidth:1, borderColor:'#2D529F' },
  modalTitle: {
    fontSize: 22, fontWeight: '800', marginBottom: 20,
    textAlign: 'center', color: '#FBBF09'
  },
  positionRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8
  },
  positionInput: { // Usado en Atletismo dentro del modal
    flex: 1, borderWidth: 1, borderColor: '#FBBF09', borderRadius: 6,
    padding: Platform.OS === 'android' ? 8 : 12,
    color: '#E8E8E8', fontSize: 16, fontWeight: '700',
    backgroundColor: '#2D529F', textAlign: 'center'
  },
  genderRow: {
    flexDirection: 'row', justifyContent: 'center', marginBottom: 20
  },
   genderBtnModal: {
    marginHorizontal: 16, padding: 12, borderRadius: 50,
    borderWidth: 1, borderColor: '#FBBF09'
  },
  genderSelected: { backgroundColor: '#FBBF09' },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', marginVertical: 10
  },
  teamScoreContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', flex: 1
  },
  teamCode: {
    fontSize: 20, fontWeight: 'bold', color: '#FBBF09', marginHorizontal: 10
  },
  scoreBtn: {
    padding: 5, borderRadius: 50,
    marginHorizontal: 5
  },
  scoreText: {
    fontSize: 28, fontWeight: 'bold', color: '#E8E8E8', marginHorizontal: 10, minWidth: 40, textAlign: 'center'
  },
  vsText: {
    fontSize: 24, fontWeight: 'bold', color: '#FBBF09', marginHorizontal: 10
  },
  statusText: {
    fontSize: 16, fontWeight: 'bold', textAlign: 'center',
    marginTop: 10, textTransform: 'uppercase'
  },
  disabledBtn: { opacity: 0.3 },
  subTitle: {
    fontSize: 20, fontWeight: '700', color: '#FBBF09',
    textAlign: 'center', marginBottom: 16,
  },
  // --- Estilos para la nueva UI de Ajedrez y Avión ---
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  genderColumn: {
    alignItems: 'center',
    flex: 1,
  },
  genderIcon:{
    marginBottom: 10,
  },
  resultItem: {
    alignItems: 'center',
    marginBottom: 10, // Espacio entre 1er y 2do lugar
  },
  resultIndex: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  resultBox: {
    width: 60,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1D1B39',
    borderWidth: 2,
    borderColor: '#FBBF09',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E8E8E8',
  },
  // --- Estilos para el formulario de Ajedrez y Avión ---
  formColumnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  positionInputForm: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#FBBF09',
    borderRadius: 8,
    paddingVertical: Platform.OS === 'android' ? 10 : 14,
    paddingHorizontal: 12,
    color: '#E8E8E8',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#2D529F',
    marginBottom: 12, // Espacio entre inputs
  },
});