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

  // Detectamos nueva categoría "vuelo_avion"
  const isAtletismo    = key.startsWith('atletismo_');
  const isMaraton      = key === 'atletismo_maraton';
  const isVelocidad    = key === 'atletismo_velocidad';
  const isRelevo       = key === 'atletismo_relevo';
  const isAjedrez      = key.startsWith('ajedrez_');
  const isAvion        = key === 'vuelo_avion';

  // Para atletismo con 1° a 8°, velocidad 4, relevo 3, avión siempre 2 (femenino y masculino)
  const positionsCount = isMaraton
    ? 8
    : isVelocidad
      ? 4
      : isRelevo
        ? 3
        : isAvion
          ? 2
          : 0;

  const [sections, setSections]       = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [codeA, setCodeA]             = useState('');
  const [codeB, setCodeB]             = useState('');
  const [positions, setPositions]     = useState(Array(positionsCount).fill(''));
  const [gender, setGender]           = useState('femenino');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const saveSection = async () => {
    if (!isAuthenticated) {
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para crear secciones.');
      return;
    }
    // payload especializado para atletismo / ajedrez / avión
    let payload;
    if (isAtletismo || isAjedrez) {
      payload = { gender, ...(isAtletismo ? { positions: positions.map(p => p.toUpperCase()) } : {}) };
    } else if (isAvion) {
      payload = { positions: positions.map(p => p.toUpperCase()) };
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
      if (!res.ok) throw new Error('No se pudo crear la sección');
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
      if (res.status !== 204) throw new Error('No se pudo eliminar');
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const toggleFinished = async sec => {
    if (!isAuthenticated) {
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

  const changeScore = async (sec, side, delta) => {
    if (!isAuthenticated) {
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión para modificar puntuaciones.');
      return;
    }
    if (sec.finished) {
      Alert.alert('Partido Finalizado', 'No se pueden modificar las puntuaciones de un partido finalizado.');
      return;
    }
    const keyScore = side === 'A' ? 'scoreA' : 'scoreB';
    const newVal   = Math.max(0, sec[keyScore] + delta);
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

  const validateCode = text =>
    text
      .toUpperCase()
      .replace(/[^1-6ABU]/g, '')
      .slice(0, 2);

  const renderPositions = (arr, disabled = true) => (
    <View style={styles.positionsContainer}>
      {arr.map((pos, idx) => (
        <View key={idx} style={styles.positionRowCenter}>
          <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
          <TextInput
            style={[styles.positionInputCenter, { opacity: 0.5 }]}
            value={pos}
            editable={false} // Siempre desactivado
            maxLength={2}
          />
        </View>
      ))}
    </View>
  );

  const renderSection = ({ item }) => {
    const isMatchFinished = item.finished;
    const statusText      = isMatchFinished ? 'FINALIZADO' : 'EN CURSO';
    const statusColor     = isMatchFinished ? '#4CAF50' : '#FBBF09';

    // === Categoría Vuelo de Avión ===
    if (isAvion) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.teamText}>{label}</Text>
        {isAuthenticated && (
          <View style={styles.iconGroup}>
            <TouchableOpacity onPress={() => toggleFinished(item)}>
              <Icon
                name={item.finished ? 'flag' : 'flag-checkered'}
                size={24}
                color="#4CAF50"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteSection(item.id)} style={styles.iconSpacing}>
              <Icon name="trash-can-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.avionResultContainer}>
        {/* Primer lugar Masculino */}
        <View style={styles.avionResultItem}>
          <Text style={styles.avionResultIndex}>Primer Lugar</Text>
          <View style={styles.avionResultBox}>
            <Text style={styles.avionResultCode}>{item.positions[0]}</Text>
          </View>
          <Icon name="gender-male" size={30} color="#FBBF09" style={styles.avionResultIcon} />
        </View>
        {/* Primer lugar Femenino */}
        <View style={styles.avionResultItem}>
          <Text style={styles.avionResultIndex}>Primer Lugar</Text>
          <View style={styles.avionResultBox}>
            <Text style={styles.avionResultCode}>{item.positions[1]}</Text>
          </View>
          <Icon name="gender-female" size={30} color="#FBBF09" style={styles.avionResultIcon} />
        </View>
      </View>

      <Text style={[styles.statusText, { color: item.finished ? '#4CAF50' : '#FBBF09' }]}>
        {item.finished ? 'FINALIZADO' : 'EN CURSO'}
      </Text>
    </View>
  );
}

    // === Atletismo ===
    if (isAtletismo) {
      return (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.teamText}>Atletismo</Text>
            {isAuthenticated && (
              <View style={styles.iconGroup}>
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
              </View>
            )}
          </View>
          {renderPositions(item.positions, isMatchFinished)}
          <View style={styles.genderRowCenter}>
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

    // === Ajedrez ===
    if (isAjedrez) {
      return (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.teamText}>Ajedrez</Text>
            {isAuthenticated && (
              <View style={styles.iconGroup}>
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
              </View>
            )}
          </View>
          <View style={styles.genderRowCenter}>
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

    // === Resto de categorías con puntuación ===
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.teamText}>{item.category}</Text>
          {isAuthenticated && (
            <View style={styles.iconGroup}>
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
            </View>
          )}
        </View>

        {/* Fila extra "1A vs 1B" */}
        <View style={styles.codeRow}>
          <Text style={styles.teamCode}>{item.codeA}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.teamCode}>{item.codeB}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.teamScoreContainer}>
            <TouchableOpacity
              onPress={() => changeScore(item, 'A', -1)}
              disabled={isMatchFinished || !isAuthenticated}
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="minus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{item.scoreA}</Text>
            <TouchableOpacity
              onPress={() => changeScore(item, 'A', 1)}
              disabled={isMatchFinished || !isAuthenticated}
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="plus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.teamScoreContainer}>
            <TouchableOpacity
              onPress={() => changeScore(item, 'B', -1)}
              disabled={isMatchFinished || !isAuthenticated}
              style={[styles.scoreBtn, (isMatchFinished || !isAuthenticated) && styles.disabledBtn]}
            >
              <Icon name="minus-circle" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{item.scoreB}</Text>
            <TouchableOpacity
              onPress={() => changeScore(item, 'B', 1)}
              disabled={isMatchFinished || !isAuthenticated}
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

      <Modal visible={showForm} animationType="fade" transparent>
  <ScrollView contentContainerStyle={styles.modalBg} keyboardShouldPersistTaps="handled">
    <View style={[styles.modalBox, { width: width * 0.9 }]}>
      <Text style={styles.modalTitle}>Crear Sección</Text>

      {isAvion ? (
        <>
          <Text style={styles.subTitle}>Selecciona Ganadores</Text>
          <View style={styles.avionContainer}>
            <View style={styles.avionSection}>
              <Text style={styles.avionLabel}>Masculino</Text>
              <TextInput
                placeholder="1A"
                style={[styles.positionInput, { borderColor: '#2D529F' }]}
                value={positions[0]}
                onChangeText={t => {
                  const up = t.toUpperCase().slice(0,2);
                  setPositions(prev => { const c = [...prev]; c[0] = up; return c; });
                }}
                maxLength={2}
              />
            </View>
            <View style={styles.avionSection}>
              <Text style={styles.avionLabel}>Femenino</Text>
              <TextInput
                placeholder="1B"
                style={[styles.positionInput, { borderColor: '#FBBF09' }]}
                value={positions[1]}
                onChangeText={t => {
                  const up = t.toUpperCase().slice(0,2);
                  setPositions(prev => { const c = [...prev]; c[1] = up; return c; });
                }}
                maxLength={2}
              />
            </View>
          </View>
        </>
      ) : (isAtletismo || isAjedrez) ? (
        <>
          {/* Selector de género para Atletismo y Ajedrez */}
          <View style={styles.genderRow}>
            <TouchableOpacity
              onPress={() => setGender('femenino')}
              style={[styles.genderBtn, gender==='femenino' && styles.genderSelected]}>
              <Icon name="gender-female" size={24} color={gender==='femenino'?'#2D529F':'#FFF'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender('masculino')}
              style={[styles.genderBtn, gender==='masculino' && styles.genderSelected]}>
              <Icon name="gender-male" size={24} color={gender==='masculino'?'#2D529F':'#FFF'} />
            </TouchableOpacity>
          </View>
          {/* Posiciones para Atletismo */}
          <View>
            {positions.map((pos, idx) => (
              <View key={idx} style={styles.positionRow}>
                <Text style={styles.positionLabel}>{`${idx+1}°:`}</Text>
                <TextInput
                  placeholder={`${idx+1}A`}
                  style={styles.positionInput}
                  value={positions[idx]}
                  onChangeText={t => {
                    const up = t.toUpperCase().slice(0,2);
                    setPositions(prev => { const c = [...prev]; c[idx] = up; return c; });
                  }}
                  maxLength={2}
                />
              </View>
            ))}
          </View>
        </>
      ) : (
        /* inputs codeA / codeB para el resto */
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
          disabled={
            (isAtletismo||isAjedrez ? !gender : false)
            || (!isAtletismo&&!isAjedrez&&!isAvion && !(codeA.length===2&&codeB.length===2))
            || !isAuthenticated
          }>
          <Text style={[
            styles.saveText,
            (
              (isAtletismo||isAjedrez ? !gender : false)
              || (!isAtletismo&&!isAjedrez&&!isAvion && !(codeA.length===2&&codeB.length===2))
              || !isAuthenticated
            ) && styles.disabled
          ]}>
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
    padding: 14, backgroundColor: '#2D529F', elevation: 4,
    paddingTop: Platform.OS==='android'?24:14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FBBF09' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#E8E8E8', fontSize: 18 },
  card: {
    backgroundColor: '#2D529F', margin: 12, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, elevation: 2,
  },
  headerRow: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    marginBottom:12
  },
  iconGroup: { flexDirection:'row', alignItems:'center' },
  iconSpacing: { marginLeft:16 },
  teamText: {
    fontSize:22, fontWeight:'900', color:'#FBBF09',
    textTransform:'uppercase', letterSpacing:2
  },

  // fila código vs código
  codeRow: {
    flexDirection:'row', justifyContent:'space-around',
    alignItems:'center', marginVertical:4
  },

  positionsContainer: {
    flexDirection:'row', flexWrap:'wrap', justifyContent:'center'
  },
  positionRowCenter: {
    flexDirection:'row', alignItems:'center', margin:4
  },
  positionLabel: { width:30, fontSize:18, color:'#FBBF09' },
  positionInputCenter: {
    width:50, borderWidth:1, borderColor:'#FBBF09', borderRadius:6,
    padding: Platform.OS==='android'?8:12,
    color:'#E8E8E8', fontSize:16, fontWeight:'700',
    backgroundColor:'#1D1B39', textAlign:'center'
  },
  genderRowCenter: {
    flexDirection:'row', justifyContent:'center', marginTop:12
  },
  genderBtn: {
    marginHorizontal:16, padding:10, borderRadius:50,
    borderWidth:1, borderColor:'#FBBF09'
  },
  genderSelected: { backgroundColor:'#FBBF09' },
  inputRow: {
    flexDirection:'row', justifyContent:'space-between', marginBottom:20
  },
  codeInput: {
    marginHorizontal:6, borderWidth:1, borderColor:'#FBBF09', borderRadius:6,
    padding: Platform.OS==='android'?8:12,
    color:'#E8E8E8', fontSize:16, fontWeight:'700',
    textAlign:'center', backgroundColor:'#2D529F'
  },
  actionsRow: {
    flexDirection:'row', justifyContent:'space-between', marginTop:20
  },
  cancelText: { fontSize:18, color:'#E8E8E8' },
  saveText: { fontSize:18, fontWeight:'700', color:'#FBBF09' },
  disabled: { opacity:0.5, color:'#777' },
  modalBg: {
    flexGrow:1, backgroundColor:'rgba(0,0,0,0.7)',
    justifyContent:'center', alignItems:'center', paddingVertical:20
  },
  modalBox: { backgroundColor:'#1D1B39', borderRadius:12, padding:24 },
  modalTitle: {
    fontSize:22, fontWeight:'800', marginBottom:20,
    textAlign:'center', color:'#FBBF09'
  },
  positionRow: {
    flexDirection:'row', alignItems:'center', marginBottom:8
  },
  positionInput: {
    flex:1, borderWidth:1, borderColor:'#FBBF09', borderRadius:6,
    padding: Platform.OS==='android'?8:12,
    color:'#E8E8E8', fontSize:16, fontWeight:'700',
    backgroundColor:'#1D1B39', textAlign:'center'
  },
  genderRow: {
    flexDirection:'row', justifyContent:'center', marginBottom:20
  },
  scoreRow: {
    flexDirection:'row', justifyContent:'space-around',
    alignItems:'center', marginVertical:10
  },
  teamScoreContainer: {
    flexDirection:'row', alignItems:'center',
    justifyContent:'center', flex:1
  },
  teamCode: {
    fontSize:20, fontWeight:'bold', color:'#FBBF09', marginHorizontal:10
  },
  scoreBtn: {
    padding:5, borderRadius:5, backgroundColor:'#1D1B39',
    marginHorizontal:5
  },
  scoreText: {
    fontSize:28, fontWeight:'bold', color:'#E8E8E8', marginHorizontal:10
  },
  vsText: {
    fontSize:24, fontWeight:'bold', color:'#FBBF09', marginHorizontal:10
  },
  statusText: {
    fontSize:16, fontWeight:'bold', textAlign:'center',
    marginTop:10, textTransform:'uppercase'
  },
  disabledBtn: { opacity:0.3 },
  subTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#FBBF09',
  textAlign: 'center',
  marginBottom: 16,
},
avionContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 24,
},
avionSection: {
  flex: 1,
  marginHorizontal: 8,
  alignItems: 'center',
},
avionLabel: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFF',
  marginBottom: 8,
},
positionInput: {
  width: '100%',
  borderWidth: 2,
  borderRadius: 8,
  paddingVertical: Platform.OS === 'android' ? 8 : 12,
  paddingHorizontal: 12,
  color: '#E8E8E8',
  fontSize: 18,
  fontWeight: '700',
  textAlign: 'center',
  backgroundColor: '#1D1B39',
},
avionResultContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginVertical: 12,
},
avionResultItem: {
  alignItems: 'center',
},
avionResultIndex: {
  fontSize: 20,
  fontWeight: '600',
  color: '#FBBF09',
  marginBottom: 4,
},
avionResultBox: {
  width: 50,
  height: 50,
  borderRadius: 8,
  backgroundColor: '#1D1B39',
  borderWidth: 2,
  borderColor: '#FBBF09',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 4,
},
avionResultCode: {
  fontSize: 20,
  fontWeight: '700',
  color: '#E8E8E8',
},
avionResultIcon: {
  marginTop: 2,
},


});
