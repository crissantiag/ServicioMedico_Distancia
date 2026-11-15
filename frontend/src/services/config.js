import Constants from 'expo-constants';

const API_PORT = 8000;

export function apiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  if (host && !host.includes('exp.direct') && !host.includes('ngrok')) return `http://${host}:${API_PORT}/api`;
  return '';
}