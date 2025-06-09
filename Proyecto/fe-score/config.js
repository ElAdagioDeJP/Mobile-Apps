// FE-SCORE/config.js
import { Platform } from "react-native";
// Cuando estés en desarrollo
const DEV_API = Platform.OS === "android"
  ? "http://10.0.2.2:5000"   // Android emulator
  : "http://localhost:5000"; // iOS simulator o expo web

// En producción (URL de tu deploy en Heroku/Railway/etc.)
const PROD_API = "mobile-apps-production.up.railway.app";

export const API_URL = __DEV__ ? DEV_API : PROD_API;
