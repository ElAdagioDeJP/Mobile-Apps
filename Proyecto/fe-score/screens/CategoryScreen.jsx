// FE-SCORE/src/screens/CategoryScreen.js

import React, { useState, useEffect } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

export default function CategoryScreen({ route, navigation }) {
  const { key, label } = route.params;

  const isAtletismo = key.startsWith("atletismo_");
  const isMaraton = key === "atletismo_maraton";
  const isVelocidad = key === "atletismo_velocidad";
  const isRelevo = key === "atletismo_relevo";

  const positionsCount = isMaraton ? 8 : isVelocidad ? 4 : isRelevo ? 3 : 0;

  const [sections, setSections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [positions, setPositions] = useState(Array(positionsCount).fill(""));
  const [gender, setGender] = useState("femenino");

  // Carga inicial de secciones desde API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/sections/${key}`);
        if (!res.ok) throw new Error("No se pudieron cargar las secciones");
        const data = await res.json();
        setSections(data);
      } catch (e) {
        Alert.alert("Error", e.message);
      }
    })();
  }, [key]);

  // Obtener header de autenticación
  const getAuthHeader = async () => {
    return await AsyncStorage.getItem("AUTH_HEADER");
  };

  // Crear nueva sección
  const saveSection = async () => {
    const payload = isAtletismo
      ? { gender, positions: positions.map((p) => p.toUpperCase()) }
      : { codeA, codeB, scoreA: 0, scoreB: 0 };
    try {
      const authHeader = await getAuthHeader();
      console.log("Auth header:", authHeader);
      const res = await fetch(`${API_URL}/sections/${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo crear la sección");
      const created = await res.json();
      setSections((prev) => [...prev, created]);
      setShowForm(false);
      setCodeA("");
      setCodeB("");
      setPositions(Array(positionsCount).fill(""));
      setGender("femenino");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Eliminar sección
  const deleteSection = async (id) => {
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${id}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (res.status !== 204) throw new Error("No se pudo eliminar");
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Confirmar eliminación
  const confirmDelete = (id) => {
    Alert.alert("Eliminar sección", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteSection(id) },
    ]);
  };

  // Marcar/desmarcar finalizado
  const toggleFinished = async (sec) => {
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${sec.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ finished: !sec.finished, date: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar");
      const updated = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sec.id ? updated : s)));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Cambiar score incremental
  const changeScore = async (sec, side, delta) => {
    const keyScore = side === "A" ? "scoreA" : "scoreB";
    const newVal = Math.max(0, sec[keyScore] + delta);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${sec.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ [keyScore]: newVal }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar score");
      const updated = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sec.id ? updated : s)));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Cambiar score directo
  const changeScoreDirect = async (sec, side, text) => {
    const val = parseInt(text, 10) || 0;
    const keyScore = side === "A" ? "scoreA" : "scoreB";
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/sections/${sec.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ [keyScore]: val }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar score");
      const updated = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sec.id ? updated : s)));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Render posiciones atletismo
  const renderPositions = (item) => (
    <View style={styles.positionsContainer}>
      {item.positions.map((pos, idx) => (
        <View key={idx} style={styles.positionRow}>
          <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
          <TextInput
            style={[styles.positionInput, item.finished && styles.disabledInput]}
            value={pos}
            editable={!item.finished}
          />
        </View>
      ))}
    </View>
  );

  // Render de cada sección
  const renderSection = ({ item }) => (
    <View style={styles.card}>
      {!isAtletismo && (
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={() => toggleFinished(item)} disabled={false}>
            <Icon
              name={item.finished ? "flag-checkered" : "flag-outline"}
              size={28}
              color={item.finished ? "#4CAF50" : "#FFF"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.iconSpacing}>
            <Icon name="trash-can-outline" size={28} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.matchHeader}>
        {!isAtletismo && <Text style={styles.teamText}>{item.codeA}</Text>}
        {isAtletismo && <Text style={styles.teamText}>Atletismo</Text>}
        {isAtletismo ? (
          renderPositions(item)
        ) : (
          <View style={styles.scoreControls}>
            <TouchableOpacity onPress={() => changeScore(item, "A", -1)} disabled={item.finished}>
              <Icon name="minus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TextInput
              style={[styles.scoreInput, item.finished && styles.disabledInput]}
              keyboardType="numeric"
              value={String(item.scoreA)}
              editable={!item.finished}
              onChangeText={(t) => changeScoreDirect(item, "A", t)}
            />
            <TouchableOpacity onPress={() => changeScore(item, "A", 1)} disabled={item.finished}>
              <Icon name="plus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.vsText}>–</Text>
            <TouchableOpacity onPress={() => changeScore(item, "B", -1)} disabled={item.finished}>
              <Icon name="minus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TextInput
              style={[styles.scoreInput, item.finished && styles.disabledInput]}
              keyboardType="numeric"
              value={String(item.scoreB)}
              editable={!item.finished}
              onChangeText={(t) => changeScoreDirect(item, "B", t)}
            />
            <TouchableOpacity onPress={() => changeScore(item, "B", 1)} disabled={item.finished}>
              <Icon name="plus-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
        {!isAtletismo && <Text style={styles.teamText}>{item.codeB}</Text>}
      </View>
    </View>
  );

  // Valida código
  const validateCode = (text) => text.toLowerCase().replace(/[^1-6ab]/g, "").slice(0, 2);

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
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSection}
        contentContainerStyle={!sections.length && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Sin secciones aún</Text>}
      />

      <Modal visible={showForm} animationType="fade" transparent>
        <ScrollView contentContainerStyle={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear Sección</Text>
            {isAtletismo ? (
              <>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    onPress={() => setGender("femenino")}
                    style={[styles.genderBtn, gender === "femenino" && styles.genderSelected]}
                  >
                    <Icon
                      name="gender-female"
                      size={24}
                      color={gender === "femenino" ? "#2D529F" : "#FFF"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setGender("masculino")}
                    style={[styles.genderBtn, gender === "masculino" && styles.genderSelected]}
                  >
                    <Icon
                      name="gender-male"
                      size={24}
                      color={gender === "masculino" ? "#2D529F" : "#FFF"}
                    />
                  </TouchableOpacity>
                </View>
                {positions.map((pos, idx) => (
                  <View key={idx} style={styles.positionRow}>
                    <Text style={styles.positionLabel}>{`${idx + 1}°:`}</Text>
                    <TextInput
                      placeholder={`${idx + 1}A`}
                      style={styles.positionInput}
                      value={positions[idx]}
                      onChangeText={(t) =>
                        setPositions((prev) => {
                          const copy = [...prev];
                          copy[idx] = t.toUpperCase().slice(0, 2);
                          return copy;
                        })
                      }
                      maxLength={2}
                    />
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="1A"
                  style={styles.codeInput}
                  value={codeA}
                  onChangeText={(t) => setCodeA(validateCode(t))}
                  maxLength={2}
                />
                <TextInput
                  placeholder="1B"
                  style={styles.codeInput}
                  value={codeB}
                  onChangeText={(t) => setCodeB(validateCode(t))}
                  maxLength={2}
                />
              </View>
            )}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSection}
                disabled={isAtletismo ? positions.some((p) => !p) : !(codeA.length === 2 && codeB.length === 2)}
              >
                <Text style={[styles.saveText, (isAtletismo ? positions.some((p) => !p) : !(codeA.length === 2 && codeB.length === 2)) && styles.disabled]}>
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
  safe: { flex: 1, backgroundColor: "#1D1B39" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#2D529F",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FBBF09",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#E8E8E8", fontSize: 18 },

  card: {
    backgroundColor: "#2D529F",
    margin: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },

  topIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconSpacing: { marginLeft: 16 },

  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FBBF09",
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  scoreControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  vsText: {
    marginHorizontal: 12,
    fontSize: 28,
    fontWeight: "800",
    color: "#FBBF09",
  },
  scoreInput: {
    width: 50,
    marginHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: "#FFF",
    textAlign: "center",
    fontSize: 20,
    color: "#FFF",
    paddingVertical: Platform.OS === "android" ? 2 : 6,
  },

  // Botón deshabilitado
  disabledBtn: { opacity: 0.4 },

  // Inputs deshabilitados
  disabledInput: { backgroundColor: "#3B3A5A", color: "#777" },

  positionsContainer: { marginTop: 12 },
  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  positionLabel: {
    width: 30,
    fontSize: 18,
    color: "#FBBF09",
  },
  positionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FBBF09",
    borderRadius: 6,
    padding: Platform.OS === "android" ? 10 : 14,
    color: "#E8E8E8",
    fontSize: 18,
    fontWeight: "700",
    backgroundColor: "#1D1B39",
    textAlign: "center",
  },

  modalBg: {
    flexGrow: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#1D1B39",
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
    color: "#FBBF09",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeInput: {
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#FBBF09",
    borderRadius: 6,
    padding: Platform.OS === "android" ? 10 : 14,
    color: "#E8E8E8",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "#2D529F",
  },
  genderRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  genderBtn: {
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#FBBF09",
  },
  genderSelected: { backgroundColor: "#FBBF09" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelText: { fontSize: 18, color: "#E8E8E8" },
  saveText: { fontSize: 18, fontWeight: "700", color: "#FBBF09" },
  disabled: { color: "#777" },
});
