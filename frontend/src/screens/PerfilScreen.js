
import React, { useContext } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { UserContext } from '../context/UserContext';
import { TabPage } from '../components/TabPage';
import { fechaNacimiento } from '../utils/cita';

const COLORS = {
  primary: '#3368A0',
  secondary: '#66A3BF',
  mint: '#C8DFDB',
  beige: '#F2EFE7',

  white: '#FFFFFF',
  text: '#263B50',
  gray: '#758493',
  border: '#E7ECEF',
  danger: '#C34D4D',
  lightBlue: '#EAF2F8',
};

const ROLES = {
  paciente: 'Paciente',
  medico: 'Médico',
  administrador: 'Administrador',
};

const iniciales = nombre =>
  String(nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('') || '?';


function Dato({ icono, etiqueta, valor }) {
  return (
    <View style={s.dato}>
      <View style={s.datoIcono}>
        <MaterialCommunityIcons
          name={icono}
          size={22}
          color={COLORS.primary}
        />
      </View>

      <View style={s.datoContenido}>
        <Text style={s.etiqueta}>{etiqueta}</Text>
        <Text selectable style={s.valor}>
          {valor}
        </Text>
      </View>
    </View>
  );
}


function Opcion({ icono, texto, descripcion, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      style={s.opcion}
      onPress={onPress}
    >
      <View style={s.opcionIcono}>
        <MaterialCommunityIcons
          name={icono}
          size={23}
          color={COLORS.primary}
        />
      </View>

      <View style={s.opcionContenido}>
        <Text style={s.opcionTexto}>{texto}</Text>
        <Text style={s.opcionDescripcion}>
          {descripcion}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={25}
        color={COLORS.secondary}
      />
    </TouchableOpacity>
  );
}


export default function PerfilScreen() {
  const { user, signOut } = useContext(UserContext);

  const confirmarSalida = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.contenido}
      >

        {/* ENCABEZADO DEL PERFIL */}
        <View style={s.portada}>

          <View style={s.decoracion1} />
          <View style={s.decoracion2} />

          <View style={s.avatarContenedor}>
            <View style={s.avatar}>
              <Text style={s.iniciales}>
                {iniciales(user?.nombre_completo)}
              </Text>
            </View>

            <View style={s.estado}>
              <MaterialCommunityIcons
                name="check"
                size={13}
                color={COLORS.white}
              />
            </View>
          </View>

          <Text style={s.nombre}>
            {user?.nombre_completo || 'Usuario'}
          </Text>

          <View style={s.rol}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={16}
              color={COLORS.white}
            />

            <Text style={s.rolTexto}>
              {ROLES[user?.rol] || 'Usuario'}
            </Text>
          </View>

          <Text style={s.subtitulo}>
            Información de mi cuenta
          </Text>

        </View>


        {/* INFORMACIÓN PERSONAL */}
        <View style={s.seccion}>

          <View style={s.tituloSeccion}>
            <View>
              <Text style={s.titulo}>
                Datos personales
              </Text>

              <Text style={s.descripcion}>
                Tu información de contacto
              </Text>
            </View>

            <View style={s.tituloIcono}>
              <MaterialCommunityIcons
                name="account-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
          </View>

          <View style={s.tarjeta}>

            <Dato
              icono="email-outline"
              etiqueta="Correo electrónico"
              valor={user?.correo || 'No registrado'}
            />

            <View style={s.separador} />

            <Dato
              icono="phone-outline"
              etiqueta="Teléfono"
              valor={user?.telefono || 'No registrado'}
            />

            <View style={s.separador} />

            <Dato
              icono="calendar-heart"
              etiqueta="Fecha de nacimiento"
              valor={fechaNacimiento(user?.fecha_nacimiento)}
            />

          </View>
        </View>


        {/* CONFIGURACIÓN Y OPCIONES */}
        <View style={s.seccion}>

          <View style={s.tituloSeccion}>
            <View>
              <Text style={s.titulo}>
                Mi cuenta
              </Text>

              <Text style={s.descripcion}>
                Administra tus opciones personales
              </Text>
            </View>

            <View style={s.tituloIcono}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
          </View>

          <View style={s.tarjeta}>

            <Opcion
              icono="pill"
              texto="Mis recetas"
              descripcion="Consulta tus recetas médicas"
              onPress={() => router.push('/recetas')}
            />

            <View style={s.separador} />

            <Opcion
              icono="account-edit-outline"
              texto="Editar mi perfil"
              descripcion="Actualiza tus datos y contraseña"
              onPress={() => router.push('/ajustes')}
            />

          </View>
        </View>


        {/* CERRAR SESIÓN */}
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          style={s.cerrarSesion}
          onPress={confirmarSalida}
        >
          <View style={s.cerrarIcono}>
            <MaterialCommunityIcons
              name="logout"
              size={22}
              color={COLORS.danger}
            />
          </View>

          <Text style={s.cerrarTexto}>
            Cerrar sesión
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={COLORS.danger}
          />
        </TouchableOpacity>

        <Text style={s.pie}>
          Gracias por utilizar nuestra aplicación
        </Text>

      </ScrollView>
  );
}


const s = StyleSheet.create({

  contenido: {
    padding: 16,
    paddingBottom: 35,
    backgroundColor: COLORS.beige,
  },

  // ENCABEZADO

  portada: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingTop: 30,
    paddingBottom: 27,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 27,
    position: 'relative',
  },

  decoracion1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.secondary,
    opacity: 0.30,
    top: -100,
    right: -35,
  },

  decoracion2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.mint,
    opacity: 0.22,
    bottom: -90,
    left: -40,
  },

  avatarContenedor: {
    marginBottom: 14,
    position: 'relative',
  },

  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: COLORS.beige,
    borderWidth: 5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iniciales: {
    fontSize: 37,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  estado: {
    position: 'absolute',
    right: 2,
    bottom: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    paddingHorizontal: 15,
  },

  rol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginTop: 10,
  },

  rolTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },

  subtitulo: {
    fontSize: 13,
    color: COLORS.mint,
    marginTop: 12,
  },


  // SECCIONES

  seccion: {
    marginBottom: 25,
  },

  tituloSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    paddingHorizontal: 3,
  },

  titulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  descripcion: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },

  tituloIcono: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },


  // TARJETAS

  tarjeta: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },

  dato: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },

  datoIcono: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  datoContenido: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },

  valor: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  separador: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 58,
  },


  // OPCIONES

  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    gap: 12,
  },

  opcionIcono: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  opcionContenido: {
    flex: 1,
  },

  opcionTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  opcionDescripcion: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },


  // CERRAR SESIÓN

  cerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 13,
    marginTop: 2,
    elevation: 1,
  },

  cerrarIcono: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FCECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  cerrarTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.danger,
  },

  pie: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 23,
  },

});
