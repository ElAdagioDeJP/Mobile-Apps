// FE-SCORE/config.js
import { Platform } from "react-native";

const DEV_API = Platform.OS === "android"
  ? "http://10.0.2.2:5000"
  : "http://localhost:5000";

// En producción (URL de tu deploy en Railway)
const PROD_API = "https://mobile-apps-production.up.railway.app"; // <--- PEGA LA URL AQUÍ

export const API_URL = __DEV__ ? DEV_API : PROD_API;