import React, { useEffect, useRef, useState } from 'react';
import { Alert, Switch, Text, TextInput, View } from 'react-native';
import { changePassword } from '../services/auth';
import { Action, styles } from './AccountUI';

export default function PasswordForm({ disabled, onBusyChange }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const submit = async () => {
    if (running.current || disabled) return;
    if (!form.current || form.next.length < 6 || form.next !== form.confirm || form.current === form.next) {
      setError(!form.current ? 'Escribe tu contraseña actual.' : form.next.length < 6 ? 'La nueva contraseña debe tener al menos 6 caracteres.' : form.next !== form.confirm ? 'Las contraseñas nuevas no coinciden.' : 'La nueva contraseña debe ser distinta.');
      return;
    }
    running.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      await changePassword(form.current, form.next);
      if (!mounted.current) return;
      setForm({ current: '', next: '', confirm: '' });
      setVisible(false);
      setOpen(false);
      Alert.alert('Contraseña actualizada', 'La próxima vez que ingreses, usa tu nueva contraseña.');
    } catch (failure) {
      if (mounted.current) setError(failure.message);
    } finally {
      running.current = false;
      if (mounted.current) { setBusy(false); onBusyChange(false); }
    }
  };
  return <View style={styles.card}>
    <Text style={styles.title}>Contraseña</Text>
    {!open ? <Action secondary disabled={disabled} onPress={() => setOpen(true)}>Cambiar contraseña</Action> : <>
      {[
        ['current', 'Contraseña actual'], ['next', 'Nueva contraseña'], ['confirm', 'Confirmar nueva contraseña'],
      ].map(([key, label]) => <View key={key} style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} value={form[key]} style={styles.input}
          onChangeText={value => { setForm(current => ({ ...current, [key]: value })); setError(''); }}
          secureTextEntry={!visible} editable={!busy && !disabled} autoCapitalize="none" autoCorrect={false}
          autoComplete={key === 'current' ? 'current-password' : 'new-password'} />
      </View>)}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={styles.text}>Mostrar contraseñas</Text><Switch accessibilityLabel="Mostrar contraseñas" value={visible} onValueChange={setVisible} disabled={busy} />
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Action disabled={busy || disabled} onPress={submit}>{busy ? 'Actualizando…' : 'Actualizar contraseña'}</Action>
      <Action secondary disabled={busy || disabled} onPress={() => { setOpen(false); setVisible(false); setError(''); setForm({ current: '', next: '', confirm: '' }); }}>Cancelar</Action>
    </>}
  </View>;
}
