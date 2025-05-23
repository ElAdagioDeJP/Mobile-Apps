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
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const database = require('../database.json');

export default function CategoryScreen({ route, navigation }) {
  const { key, label } = route.params;
  const storageKey = `sections_${key}`;
  const isGendered = ['atletismo_velocidad','atletismo_maraton','atletismo_relevo','vuelo_avion'].includes(key);

  const [sections, setSections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codeA, setCodeA] = useState('');
  const [codeB, setCodeB] = useState('');
  const [gender, setGender] = useState('femenino');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) setSections(JSON.parse(stored));
      else if (database[key]) setSections(database[key]);
    })();
  }, []);

  const persist = async list => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(list));
    setSections(list);
  };

  const saveSection = async () => {
    const newSection = {
      id: Date.now().toString(),
      codeA,
      codeB,
      gender: isGendered ? gender : null,
      scoreA: 0,
      scoreB: 0,
      finished: false
    };
    await persist([...sections, newSection]);
    setShowForm(false);
    setCodeA(''); setCodeB(''); setGender('femenino');
  };

  // Eliminar sección directamente usando persist para asegurar re-render
  const deleteSection = async id => {
    try {
      const newList = sections.filter(s => s.id !== id);
      await persist(newList);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la sección');
      console.error('deleteSection error:', error);
    }
  };

  const confirmDelete = id => {
    Alert.alert(
      'Eliminar sección',
      '¿Estás seguro de que deseas eliminar esta sección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteSection(id) }
      ]
    );
  };

  const toggleFinished = async id => {
    const updated = sections.map(s =>
      s.id === id ? { ...s, finished: !s.finished } : s
    );
    await persist(updated);
  };

  const updateScoreVal = async (id, field, delta) => {
    const updated = sections.map(s => {
      if (s.id === id) {
        let newVal = (s[field] || 0) + delta;
        if (newVal < 0) newVal = 0;
        if (newVal > 10000) newVal = 10000;
        return { ...s, [field]: newVal };
      }
      return s;
    });
    await persist(updated);
  };

  const onChangeScore = async (id, field, text) => {
    if (text === '') {
      const updatedEmpty = sections.map(s =>
        s.id === id ? { ...s, [field]: 0 } : s
      );
      await persist(updatedEmpty);
      return;
    }
    let num = parseInt(text, 10);
    if (isNaN(num)) return;
    if (num < 0) num = 0;
    if (num > 10000) num = 10000;
    const updated = sections.map(s =>
      s.id === id ? { ...s, [field]: num } : s
    );
    await persist(updated);
  };

  const renderSection = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.matchHeader}>
        <Text style={styles.teamText}>{item.codeA}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => toggleFinished(item.id)} style={styles.iconBtn}>
            <Icon
              name={item.finished ? 'flag-checkered' : 'flag-outline'}
              size={24}
              color={item.finished ? '#4CAF50' : '#FFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.iconBtn}>
            <Icon
              name="trash-can-outline"
              size={24}
              color="#E74C3C"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.teamText}>{item.codeB}</Text>
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.scoreControl}>
          <TouchableOpacity disabled={item.finished} onPress={() => updateScoreVal(item.id, 'scoreA', -1)}>
            <Icon name="minus-circle" size={28} color={item.finished ? '#ccc' : '#E74C3C'} />
          </TouchableOpacity>
          <TextInput
            style={[styles.scoreInput, item.finished && styles.disabledInput]}
            keyboardType="numeric"
            value={String(item.scoreA)}
            editable={!item.finished}
            onChangeText={t => onChangeScore(item.id, 'scoreA', t)}
          />
          <TouchableOpacity disabled={item.finished} onPress={() => updateScoreVal(item.id, 'scoreA', 1)}>
            <Icon name="plus-circle" size={28} color={item.finished ? '#ccc' : '#2ECC71'} />
          </TouchableOpacity>
        </View>
        <View style={styles.scoreControl}>
          <TouchableOpacity disabled={item.finished} onPress={() => updateScoreVal(item.id, 'scoreB', -1)}>
            <Icon name="minus-circle" size={28} color={item.finished ? '#ccc' : '#E74C3C'} />
          </TouchableOpacity>
          <TextInput
            style={[styles.scoreInput, item.finished && styles.disabledInput]}
            keyboardType="numeric"
            value={String(item.scoreB)}
            editable={!item.finished}
            onChangeText={t => onChangeScore(item.id, 'scoreB', t)}
          />
          <TouchableOpacity disabled={item.finished} onPress={() => updateScoreVal(item.id, 'scoreB', 1)}>
            <Icon name="plus-circle" size={28} color={item.finished ? '#ccc' : '#2ECC71'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const validateCode = text => text.toLowerCase().replace(/[^1-5ab]/g, '').slice(0,2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left-bold" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label}</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Icon name="plus-circle" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={item => item.id}
        renderItem={renderSection}
        contentContainerStyle={!sections.length && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Sin secciones aún</Text>}
      />

      <Modal visible={showForm} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear Sección</Text>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="1a"
                style={styles.codeInput}
                value={codeA}
                onChangeText={t => setCodeA(validateCode(t))}
                maxLength={2}
              />
              <TextInput
                placeholder="1b"
                style={styles.codeInput}
                value={codeB}
                onChangeText={t => setCodeB(validateCode(t))}
                maxLength={2}
              />
            </View>
            {isGendered && (
              <View style={styles.genderRow}>
                <TouchableOpacity onPress={()=>setGender('femenino')} style={[styles.genderBtn, gender==='femenino'&&styles.genderSelected]}>
                  <Icon name="gender-female" size={24} color={gender==='femenino'? '#2D529F':'#FFF'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setGender('masculino')} style={[styles.genderBtn, gender==='masculino'&&styles.genderSelected]}>
                  <Icon name="gender-male" size={24} color={gender==='masculino'? '#2D529F':'#FFF'} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={()=>setShowForm(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSection} disabled={!(codeA.length===2 && codeB.length===2)}>
                <Text style={[styles.saveText, !(codeA.length===2&&codeB.length===2)&&styles.disabled]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#1D1B39' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#2D529F', elevation:4 },
  headerTitle:{ fontSize:24, fontWeight:'800', color:'#FBBF09' },
  emptyContainer:{ flex:1, justifyContent:'center', alignItems:'center' },
  emptyText:{ color:'#E8E8E8', fontSize:18 },
  card:{ backgroundColor:'#2D529F', margin:12, borderRadius:12, padding:16, elevation:2 },
  matchHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  headerIcons:{ flexDirection:'row' },
  iconBtn:{ marginHorizontal:8 },
  teamText:{ fontSize:22, fontWeight:'900', color:'#FBBF09', textTransform:'uppercase', letterSpacing:2 },
  scoreRow:{ flexDirection:'row', justifyContent:'space-around', marginTop:8 },
  scoreControl:{ flexDirection:'row', alignItems:'center' },
  scoreInput:{ width:60, textAlign:'center', borderWidth:1, borderColor:'#FBBF09', borderRadius:6, color:'#E8E8E8', fontSize:20, backgroundColor:'#1D1B39', marginHorizontal:4 },
  disabledInput:{ backgroundColor:'#3B3A5A', color:'#777' },
  modalBg:{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center' },
  modalBox:{ width:'85%', backgroundColor:'#1D1B39', borderRadius:12, padding:24 },
  modalTitle:{ fontSize:22, fontWeight:'800', marginBottom:20, textAlign:'center', color:'#FBBF09' },
  inputRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:20 },
  codeInput:{ flex:1, marginHorizontal:6, borderWidth:1, borderColor:'#FBBF09', borderRadius:6, padding:Platform.OS==='android'?10:14, color:'#E8E8E8', fontSize:18, fontWeight:'700', textAlign:'center', backgroundColor:'#2D529F' },
  genderRow:{ flexDirection:'row', justifyContent:'center', marginBottom:20 },
  genderBtn:{ marginHorizontal:16, padding:10, borderRadius:50, borderWidth:1, borderColor:'#FBBF09' },
  genderSelected:{ backgroundColor:'#FBBF09' },
  actionsRow:{ flexDirection:'row', justifyContent:'space-between' },
  cancelText:{ fontSize:18, color:'#E8E8E8' },
  saveText:{ fontSize:18, fontWeight:'700', color:'#FBBF09' },
  disabled:{ color:'#777' }
});