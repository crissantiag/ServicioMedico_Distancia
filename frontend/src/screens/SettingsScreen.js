import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import PasswordForm from '../components/PasswordForm';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { profileForm, profilePayload, validateProfile } from '../utils/profile';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';

function ProfileForm({ profile }) {
  const { updateUser, signOut } = useContext(UserContext);
  const [form, setForm] = useState(() => profileForm(profile));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const change = (key, value) => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); };
  const save = async () => {
    if (saving.current || passwordBusy) return;
    const validation = validateProfile(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    saving.current = true;
    setBusy(true);
    try {
      const { data } = await account.update(profilePayload(form));
      if (!mounted.current) return;
      updateUser(data);
      setForm(profileForm(data));
      Alert.alert('Datos guardados', 'Tu perfil se actualizó correctamente.');
    } catch (error) {
      if (!mounted.current) return;
      if (error.errors) setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)])));
      else Alert.alert('No se pudo guardar', error.message);
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return <>
    <View style={styles.card}>
      <Text style={styles.title}>Mi perfil</Text>
      <View style={styles.field}><Text style={styles.label}>Correo electrónico</Text>
        <Text selectable style={[styles.input, styles.readonly, { paddingVertical: 12 }]}>{profile.correo}</Text>
      </View>
      {[
        ['nombre_completo', 'Nombre completo', 'default', 150, 'Tu nombre'],
        ['telefono', 'Teléfono', 'phone-pad', 20, 'Opcional'],
        ['fecha_nacimiento', 'Fecha de nacimiento', 'numbers-and-punctuation', 10, 'AAAA-MM-DD'],
      ].map(([key, label, keyboard, length, placeholder]) => <View style={styles.field} key={key}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} style={styles.input} value={form[key]} onChangeText={value => change(key, value)}
          editable={!busy && !passwordBusy} keyboardType={keyboard} maxLength={length} placeholder={placeholder} placeholderTextColor="#64748B"
          autoCapitalize={key === 'nombre_completo' ? 'words' : 'none'} autoCorrect={false} />
        {errors[key] ? <Text accessibilityRole="alert" style={styles.error}>{errors[key]}</Text> : null}
      </View>)}
      <Action onPress={save} disabled={busy || passwordBusy}>{busy ? 'Guardando…' : 'Guardar cambios'}</Action>
    </View>
    <PasswordForm disabled={busy} onBusyChange={setPasswordBusy} />
    <View style={styles.card}><Text style={styles.title}>Mi sesión</Text>
      <Action secondary disabled={busy || passwordBusy} onPress={() => Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
        { text: 'Cancelar', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: signOut },
      ])}>Cerrar sesión</Action>
    </View>
  </>;
}
export default function SettingsScreen() {
  const profile = useResource(account.profile);
  return <AccountPage title="Ajustes de la app">
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Feedback loading={profile.loading} error={profile.error} retry={profile.reload} />
        {profile.data?.data ? <ProfileForm profile={profile.data.data} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </AccountPage>;
}
