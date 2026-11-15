
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { NotificacionesContext } from '../context/NotificacionesContext';
import { notificaciones, rutaDeNotificacion } from '../services/notifications';

const COLORS = {
  primary: '#3368A0',
  secondary: '#66A3BF',
  mint: '#C8DFDB',
  beige: '#F2EFE7',

  white: '#FFFFFF',
  text: '#263B50',
  gray: '#758493',
  border: '#E4EAE9',
  lightBlue: '#EAF2F8',
  danger: '#C34D4D',
};

const ICONOS = {
  cita_creada: 'calendar-plus',
  cita_reprogramada: 'calendar-clock',
  cita_estado: 'calendar-check',
  recordatorio_cita: 'alarm',
  receta: 'pill',
  chat: 'message-text',
  foro: 'forum',
  aviso: 'bullhorn',
};

function cuando(valor) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toDateString() === new Date().toDateString()
    ? fecha.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : fecha.toLocaleDateString('es', {
        day: 'numeric',
        month: 'short',
      });
}


// TARJETA DE NOTIFICACIÓN

function Fila({ item, onAbrir, onEliminar }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.leida ? '' : 'Sin leer. '}${item.titulo}. ${item.mensaje}`}
      style={[
        s.fila,
        !item.leida ? s.filaNueva : s.filaLeida,
      ]}
      onPress={() => onAbrir(item)}
    >

      <View
        style={[
          s.icono,
          !item.leida ? s.iconoNuevo : s.iconoLeido,
        ]}
      >
        <MaterialCommunityIcons
          name={ICONOS[item.tipo] || 'bell'}
          size={23}
          color={item.leida ? COLORS.primary : COLORS.white}
        />
      </View>

      <View style={s.cuerpo}>

        <View style={s.titularFila}>
          <Text
            numberOfLines={2}
            style={[
              s.titular,
              !item.leida && s.titularNuevo,
            ]}
          >
            {item.titulo}
          </Text>

          <Text style={s.hora}>
            {cuando(item.created_at)}
          </Text>
        </View>

        <Text
          numberOfLines={3}
          style={s.mensaje}
        >
          {item.mensaje}
        </Text>

        {!item.leida && (
          <View style={s.estado}>
            <View style={s.punto} />
            <Text style={s.estadoTexto}>
              Nueva notificación
            </Text>
          </View>
        )}

      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Eliminar notificación"
        hitSlop={10}
        style={s.eliminar}
        onPress={() => onEliminar(item)}
      >
        <MaterialCommunityIcons
          name="close-circle-outline"
          size={21}
          color={COLORS.gray}
        />
      </TouchableOpacity>

    </TouchableOpacity>
  );
}


// PANTALLA PRINCIPAL

export default function NotificacionesScreen() {
  const { user } = useContext(UserContext);
  const { refrescar } = useContext(NotificacionesContext);

  const puedeEnviar =
    user?.rol === 'medico' ||
    user?.rol === 'administrador';

  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [ultima, setUltima] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [masCargando, setMasCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (numero = 1) => {
    try {
      const { data, meta } = await notificaciones.listar({
        page: numero,
      });

      setItems(actual =>
        numero === 1
          ? data
          : [
              ...actual,
              ...data.filter(n =>
                !actual.some(
                  a => a.id_notificacion === n.id_notificacion
                )
              ),
            ]
      );

      setPagina(meta?.current_page ?? numero);
      setUltima(meta?.last_page ?? 1);
      setError('');

    } catch (e) {
      setError(e.message);

    } finally {
      setCargando(false);
      setRefrescando(false);
      setMasCargando(false);
    }
  }, []);

  // ACTUALIZAR AL VOLVER A LA PESTAÑA

  useFocusEffect(
    useCallback(() => {
      cargar(1);
      refrescar();
    }, [cargar, refrescar])
  );


  // ABRIR NOTIFICACIÓN

  const abrir = item => {
    if (!item.leida) {
      setItems(actual =>
        actual.map(n =>
          n.id_notificacion === item.id_notificacion
            ? { ...n, leida: true }
            : n
        )
      );

      notificaciones
        .marcarLeida(item.id_notificacion)
        .then(refrescar)
        .catch(() => {});
    }

    const ruta = rutaDeNotificacion(item.datos);

    if (ruta) router.push(ruta);
  };


  // ELIMINAR NOTIFICACIÓN

  const eliminar = item => {
    setItems(actual =>
      actual.filter(
        n => n.id_notificacion !== item.id_notificacion
      )
    );

    notificaciones
      .eliminar(item.id_notificacion)
      .then(refrescar)
      .catch(() => cargar(1));
  };


  // MARCAR TODAS COMO LEÍDAS

  const marcarTodas = () => {
    setItems(actual =>
      actual.map(n => ({ ...n, leida: true }))
    );

    notificaciones
      .marcarTodas()
      .then(refrescar)
      .catch(() => cargar(1));
  };


  const hayNoLeidas = items.some(n => !n.leida);
  const cantidadNuevas = items.filter(n => !n.leida).length;


  return (
      <View style={s.contenido}>

        {/* ENCABEZADO */}

        <View style={s.encabezado}>
          <View>
            <Text style={s.titulo}>
              Tus notificaciones
            </Text>

            <Text style={s.subtitulo}>
              Mantente al día con tus novedades
            </Text>
          </View>

          <View style={s.campana}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={27}
              color={COLORS.primary}
            />

            {cantidadNuevas > 0 && (
              <View style={s.insignia}>
                <Text style={s.insigniaTexto}>
                  {cantidadNuevas > 99 ? '99+' : cantidadNuevas}
                </Text>
              </View>
            )}
          </View>
        </View>


        {/* ACCIONES */}

        <View style={s.barra}>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !hayNoLeidas }}
            disabled={!hayNoLeidas}
            onPress={marcarTodas}
            activeOpacity={0.7}
            style={[
              s.accion,
              !hayNoLeidas && s.accionOff,
            ]}
          >
            <MaterialCommunityIcons
              name="check-all"
              size={19}
              color={COLORS.primary}
            />

            <Text style={s.accionTexto}>
              Marcar leídas
            </Text>
          </TouchableOpacity>

          {puedeEnviar && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push('/enviar-notificacion')}
              activeOpacity={0.8}
              style={[
                s.accion,
                s.accionPrincipal,
              ]}
            >
              <MaterialCommunityIcons
                name="send"
                size={17}
                color={COLORS.white}
              />

              <Text style={s.accionTextoBlanco}>
                Enviar aviso
              </Text>
            </TouchableOpacity>
          )}

        </View>


        {/* LISTA */}

        {cargando ? (

          <ActivityIndicator
            accessibilityLabel="Cargando"
            color={COLORS.primary}
            size="large"
            style={{ marginTop: 50 }}
          />

        ) : (

          <FlatList
            data={items}
            keyExtractor={item =>
              String(item.id_notificacion)
            }

            renderItem={({ item }) => (
              <Fila
                item={item}
                onAbrir={abrir}
                onEliminar={eliminar}
              />
            )}

            showsVerticalScrollIndicator={false}

            contentContainerStyle={[
              s.lista,
              items.length === 0 && s.listaVacia,
            ]}

            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setRefrescando(true);
                  cargar(1);
                }}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }

            onEndReachedThreshold={0.4}

            onEndReached={() => {
              if (masCargando || pagina >= ultima) return;

              setMasCargando(true);
              cargar(pagina + 1);
            }}

            ListFooterComponent={
              masCargando ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ marginVertical: 18 }}
                />
              ) : null
            }

            ListEmptyComponent={
              <View
                style={s.vacia}
                accessibilityRole={error ? 'alert' : undefined}
              >

                <View style={s.vaciaIcono}>
                  <MaterialCommunityIcons
                    name={
                      error
                        ? 'alert-circle-outline'
                        : 'bell-sleep-outline'
                    }
                    size={43}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={s.vaciaTitulo}>
                  {error
                    ? 'No se pudieron cargar'
                    : '¡Todo al día!'}
                </Text>

                <Text style={s.vaciaTexto}>
                  {error ||
                    'Cuando recibas recordatorios de tus citas o avisos de tus médicos, aparecerán aquí.'}
                </Text>

              </View>
            }
          />

        )}

      </View>
  );
}


// ESTILOS

const s = StyleSheet.create({

  contenido: {
    flex: 1,
    backgroundColor: COLORS.beige,
  },

  // ENCABEZADO

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 17,
  },

  titulo: {
    fontSize: 21,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  subtitulo: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 5,
  },

  campana: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  insignia: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.beige,
  },

  insigniaTexto: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },


  // BOTONES

  barra: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mint,
  },

  accionOff: {
    opacity: 0.45,
  },

  accionPrincipal: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  accionTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  accionTextoBlanco: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },


  // LISTA

  lista: {
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 30,
    gap: 11,
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },


  // TARJETAS

  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderRadius: 18,
    padding: 14,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  filaNueva: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  filaLeida: {
    backgroundColor: '#E6F0ED',
  },

  icono: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconoNuevo: {
    backgroundColor: COLORS.primary,
  },

  iconoLeido: {
    backgroundColor: COLORS.mint,
  },

  cuerpo: {
    flex: 1,
    paddingTop: 2,
  },

  titularFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  titular: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 20,
  },

  titularNuevo: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  hora: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 3,
  },

  mensaje: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 5,
    lineHeight: 19,
  },

  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },

  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },

  estadoTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  eliminar: {
    padding: 2,
  },


  // ESTADO VACÍO

  vacia: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 25,
    paddingVertical: 35,
    marginHorizontal: 5,
  },

  vaciaIcono: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  vaciaTitulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },

  vaciaTexto: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },

});
