// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { encode as btoa } from "base-64";
import { showMessage } from "react-native-flash-message";  // ← importar

const COLORS = {
  primary: "#6C5CE7",
  greyText: "#F1F1F1",
  white: "#FFF",
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = email.length > 0 && password.length > 0;

  const handleLogin = async () => {
    const authHeader = "Basic " + btoa(`${email}:${password}`);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "GET",
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        throw new Error(res.status === 401
          ? "📛 Credenciales inválidas"
          : "❗ Error inesperado al autenticar");
      }
      const user = await res.json();
      await AsyncStorage.setItem("AUTH_HEADER", authHeader);
      await AsyncStorage.setItem("USER_EMAIL", user.email);
      await AsyncStorage.setItem("IS_ADMIN", String(user.is_admin));

      // Mensaje de éxito
      showMessage({
        message: "✅ ¡Login exitoso!",
        description: `Bienvenido, ${user.email}`,
        type: "success",
        icon: "success",
      });

      // Navegar tras un breve delay para que el usuario lea el toast
      setTimeout(() => {
        navigation.navigate("Inicio", {
          screen: "Category",
          params: { key: "futbol", label: "Fútbol" },
        });
      }, 800);
    } catch (e) {
      // Mensaje de error
      showMessage({
        message: "🚫 Login fallido",
        description: e.message,
        type: "danger",
        icon: "danger",
      });
      console.error("Error en handleLogin:", e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: null })}
    >
      <Image
        source={require("../assets/logo.png")}
        style={{ width: 200, height: 63, alignSelf: "center", marginBottom: 16 }}
      />

      <View style={styles.inputWrapper}>
        <Icon name="email-outline" size={20} color={COLORS.greyText} />
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor={COLORS.greyText}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="lock-outline" size={20} color={COLORS.greyText} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={COLORS.greyText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1D1B39", padding: 24, justifyContent: "center" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5564eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    elevation: 2,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16, color: "#FFF" },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#2D529F",
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});
