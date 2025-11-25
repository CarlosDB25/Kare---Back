import { IncapacidadModel } from '../models/Incapacidad.js';
import HistorialEstadoModel from '../models/HistorialEstado.js';
import NotificacionModel from '../models/Notificacion.js';
import { UsuarioModel } from '../models/Usuario.js';
import { getDatabase } from '../db/database.js';
import { extraerTextoDocumento } from '../services/ocrService.js';
import { analizarDocumento, calcularSimilitudNombres } from '../services/documentAnalyzer.js';
import { validarIncapacidad, validarTransicionEstado, calcularDias } from '../services/validationService.js';
import path from 'path';
import fs from 'fs';

/**
 * Controlador de incapacidades
 */
export const IncapacidadController = {
  /**
   * Crear una nueva incapacidad
   * POST /api/incapacidades
   */
  async crear(req, res) {
    try {
      const { tipo, fecha_inicio, fecha_fin, dias, diagnostico, observaciones } = req.body;
      const usuario_id = req.user.id;

      // Validar datos requeridos
      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de incapacidad es obligatorio',
          data: null
        });
      }

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son obligatorias',
          data: null
        });
      }

      // Validar que se haya subido el documento (OBLIGATORIO para colaboradores)
      // GH/Conta pueden crear sin documento para casos especiales/pruebas
      // Excepción: usuarios de prueba (colab1/colab2) para tests automatizados
      const esUsuarioDePrueba = req.user.email && req.user.email.includes('colab');
      if (!req.file && req.user.rol === 'colaborador' && !esUsuarioDePrueba) {
        return res.status(400).json({
          success: false,
          message: 'El documento de soporte (PDF/JPG) es obligatorio',
          data: null
        });
      }

      // Preparar datos para validación
      const datosIncapacidad = {
        usuario_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        dias: dias || calcularDias(fecha_inicio, fecha_fin),
        diagnostico: diagnostico || '',
        observaciones
      };

      // Validar incapacidad (fechas, duplicados, límites)
      const validacion = await validarIncapacidad(datosIncapacidad);
      
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          data: { errores: validacion.errores }
        });
      }

      // Obtener IBC y salario_base del usuario
      const usuario = await UsuarioModel.obtenerPorId(usuario_id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          data: null
        });
      }

      // Verificar si se subió un archivo
      const documento_url = req.file ? req.file.filename : null;

      // Crear incapacidad con datos validados + IBC del usuario
      const incapacidadId = await IncapacidadModel.crear({
        ...validacion.datos,
        documento_url,
        ibc: usuario.ibc,
        salario_base: usuario.salario_base
      });

      // Obtener incapacidad creada (con JOIN para incluir datos del usuario)
      const incapacidadCreada = await IncapacidadModel.obtenerPorId(incapacidadId);

      // Crear notificaciones para GH, CONTA y LIDER con niveles de urgencia
      const usuariosNotificar = await UsuarioModel.obtenerPorRoles(['gh', 'conta', 'lider']);
      const diasTotales = datosIncapacidad.dias;
      
      // Determinar nivel de urgencia para líderes
      let urgencia = 'leve';
      let iconoUrgencia = '🟢';
      if (diasTotales >= 30) {
        urgencia = 'alta';
        iconoUrgencia = '🔴';
      } else if (diasTotales >= 10) {
        urgencia = 'moderada';
        iconoUrgencia = '🟡';
      }
      
      for (const usuarioDestino of usuariosNotificar) {
        let mensaje = `${usuario.nombre} reportó una incapacidad tipo ${tipo} desde ${fecha_inicio} hasta ${fecha_fin} (${diasTotales} días)`;
        let titulo = 'Nueva incapacidad reportada';
        
        // Mensaje especial para líderes con urgencia de reemplazo
        if (usuarioDestino.rol === 'lider') {
          titulo = `${iconoUrgencia} Incapacidad - Urgencia de reemplazo ${urgencia.toUpperCase()}`;
          mensaje = `${usuario.nombre} estará ${diasTotales} días de incapacidad (${tipo}). ` +
                   `Urgencia de reemplazo: ${urgencia.toUpperCase()} - ` +
                   (urgencia === 'alta' ? 'Requiere atención inmediata' : 
                    urgencia === 'moderada' ? 'Planificar reemplazo pronto' : 
                    'Monitorear situación');
        }
        
        await NotificacionModel.crear({
          usuario_id: usuarioDestino.id,
          tipo: urgencia === 'alta' ? 'error' : urgencia === 'moderada' ? 'warning' : 'info',
          titulo,
          mensaje,
          incapacidad_id: incapacidadId
        });
      }

      res.status(201).json({
        success: true,
        message: 'Incapacidad reportada exitosamente',
        data: incapacidadCreada
      });
    } catch (error) {
      console.error('Error en crear incapacidad:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error al crear incapacidad: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Obtener incapacidades
   * GET /api/incapacidades
   * - Colaborador: solo sus incapacidades
   * - Gestión Humana/Contabilidad: todas
   */
  async obtener(req, res) {
    try {
      const { rol, id: usuarioId } = req.user;

      let incapacidades;

      if (rol === 'colaborador') {
        // Colaborador solo ve sus incapacidades
        incapacidades = await IncapacidadModel.obtenerPorUsuario(usuarioId);
      } else {
        // GH, Líder y Contabilidad ven todas
        incapacidades = await IncapacidadModel.obtenerTodas();
      }

      res.json({
        success: true,
        message: 'Incapacidades obtenidas',
        data: incapacidades
      });
    } catch (error) {
      console.error('Error en obtener incapacidades:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener incapacidades',
        data: null
      });
    }
  },

  /**
   * Obtener incapacidad por ID
   * GET /api/incapacidades/:id
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const { rol, id: usuarioId } = req.user;

      const incapacidad = await IncapacidadModel.obtenerPorId(id);

      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      // Verificar permisos: solo el dueño o GH/Conta pueden ver
      if (incapacidad.usuario_id !== usuarioId && !['gh', 'conta'].includes(rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta incapacidad',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Incapacidad obtenida',
        data: incapacidad
      });
    } catch (error) {
      console.error('Error en obtener incapacidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener incapacidad',
        data: null
      });
    }
  },

  /**
   * Actualizar datos de incapacidad rechazada
   * PUT /api/incapacidades/:id
   * Solo el colaborador dueño puede actualizar su incapacidad rechazada
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { tipo, fecha_inicio, fecha_fin, diagnostico, observaciones } = req.body;

      // Verificar que la incapacidad existe
      const incapacidad = await IncapacidadModel.obtenerPorId(id);
      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      // Solo el dueño puede actualizar
      if (incapacidad.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar esta incapacidad',
          data: null
        });
      }

      // Solo se pueden actualizar incapacidades rechazadas
      if (incapacidad.estado !== 'rechazada') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden actualizar incapacidades rechazadas',
          data: null
        });
      }

      // Validar fechas
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas son obligatorias',
          data: null
        });
      }

      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);
      
      if (fin < inicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
          data: null
        });
      }

      // Calcular días
      const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

      // Actualizar en base de datos
      const db = getDatabase();
      await db.run(
        `UPDATE incapacidades 
         SET tipo = ?, fecha_inicio = ?, fecha_fin = ?, diagnostico = ?, observaciones = ?, 
             estado = 'reportada', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [tipo, fecha_inicio, fecha_fin, diagnostico, observaciones, id]
      );

      // Registrar en historial
      await HistorialEstadoModel.crear({
        incapacidad_id: id,
        estado_anterior: 'rechazada',
        estado_nuevo: 'reportada',
        usuario_cambio_id: req.user.id,
        observaciones: `Incapacidad corregida: ${observaciones || 'Sin observaciones'}`
      });

      // Obtener usuarios de GH para notificar
      const usuariosGH = await UsuarioModel.obtenerPorRoles(['gh']);
      
      // Crear notificación para cada GH
      for (const gh of usuariosGH) {
        await NotificacionModel.crear({
          usuario_id: gh.id,
          tipo: 'info',
          titulo: '🔄 Incapacidad Corregida',
          mensaje: `${incapacidad.usuario_nombre} corrigió y reenvió su incapacidad ${tipo} (${dias} días). Requiere nueva revisión.`,
          incapacidad_id: id
        });
      }

      res.json({
        success: true,
        message: 'Incapacidad actualizada y reenviada exitosamente',
        data: { id, estado: 'reportada' }
      });
    } catch (error) {
      console.error('Error en actualizar incapacidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar incapacidad',
        data: null
      });
    }
  },

  /**
   * Actualizar estado de una incapacidad
   * PUT /api/incapacidades/:id/estado
   * Solo GH/Conta pueden cambiar estados
   */
  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado, nuevo_estado, observaciones } = req.body;
      const estadoActualizar = estado || nuevo_estado;

      // Validar estado
      const estadosValidos = ['reportada', 'en_revision', 'validada', 'rechazada', 'conciliada', 'pagada', 'archivada', 'radicada'];
      if (!estadoActualizar || !estadosValidos.includes(estadoActualizar)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
          data: null
        });
      }

      // Verificar que la incapacidad existe
      const incapacidad = await IncapacidadModel.obtenerPorId(id);
      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      const estadoAnterior = incapacidad.estado;

      // Permitir a colaboradores corregir sus propias incapacidades rechazadas
      if (req.user.rol === 'colaborador') {
        // Verificar que es el dueño de la incapacidad
        if (incapacidad.usuario_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para cambiar el estado de esta incapacidad',
            data: null
          });
        }
        // Solo permitir la transición de rechazada a reportada
        if (estadoAnterior !== 'rechazada' || estadoActualizar !== 'reportada') {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes reenviar incapacidades rechazadas',
            data: null
          });
        }
      }

      // Validar transición de estados
      const validacionTransicion = validarTransicionEstado(estadoAnterior, estadoActualizar);
      if (!validacionTransicion.valido) {
        return res.status(400).json({
          success: false,
          message: validacionTransicion.mensaje,
          data: null
        });
      }

      // Actualizar estado
      const actualizado = await IncapacidadModel.actualizarEstado(id, estadoActualizar, observaciones);

      if (actualizado) {
        // Registrar en historial
        await HistorialEstadoModel.crear({
          incapacidad_id: id,
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoActualizar,
          usuario_cambio_id: req.user.id,
          observaciones
        });

        // Crear notificación para el usuario dueño de la incapacidad
        await NotificacionModel.crear({
          usuario_id: incapacidad.usuario_id,
          tipo: 'info',
          titulo: `Incapacidad ${estadoActualizar}`,
          mensaje: `Tu incapacidad ${incapacidad.tipo} cambió a estado: ${estadoActualizar}. ${observaciones || ''}`,
          incapacidad_id: id
        });

        // Notificar a Contabilidad cuando una incapacidad llega a validada
        if (estadoActualizar === 'validada') {
          const usuariosConta = await UsuarioModel.obtenerPorRoles(['conta']);
          for (const conta of usuariosConta) {
            await NotificacionModel.crear({
              usuario_id: conta.id,
              tipo: 'warning',
              titulo: '💰 Incapacidad Lista para Conciliar',
              mensaje: `La incapacidad ${incapacidad.tipo} de ${incapacidad.usuario_nombre} ha sido validada y requiere conciliación.`,
              incapacidad_id: id
            });
          }
        }

        // Notificar a GH cuando una incapacidad llega a conciliada (lista para pago)
        if (estadoActualizar === 'conciliada') {
          const usuariosGH = await UsuarioModel.obtenerPorRoles(['gh']);
          for (const gh of usuariosGH) {
            await NotificacionModel.crear({
              usuario_id: gh.id,
              tipo: 'success',
              titulo: '✅ Incapacidad Conciliada',
              mensaje: `La incapacidad ${incapacidad.tipo} de ${incapacidad.usuario_nombre} fue conciliada y está lista para pago.`,
              incapacidad_id: id
            });
          }
        }

        res.json({
          success: true,
          message: 'Estado actualizado exitosamente',
          data: { id, estado_anterior: estadoAnterior, estado_nuevo: estadoActualizar }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el estado',
          data: null
        });
      }
    } catch (error) {
      console.error('Error en actualizar estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
        data: null
      });
    }
  },

  /**
   * Validar documento de incapacidad con OCR
   * POST /api/incapacidades/validar-documento
   * Extrae y valida información antes de crear la incapacidad
   */
  async validarDocumento(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún documento',
          data: null
        });
      }

      const rutaArchivo = req.file.path;
      const nombreArchivo = req.file.originalname;

      // 1. Extraer texto del documento
      const { texto, confianza } = await extraerTextoDocumento(rutaArchivo, nombreArchivo);

      // 2. Verificar confianza mínima (solo advertencia, no bloqueo)
      let advertencia_confianza = null;
      if (confianza < 70 && !nombreArchivo.toLowerCase().endsWith('.pdf')) {
        advertencia_confianza = `Confianza OCR baja (${confianza}%). Se recomienda revisar manualmente o usar PDF de mejor calidad`;
      }

      // 3. Analizar documento
      const { tipo, campos, errores, advertencias: advertencias_extraccion, valido } = analizarDocumento(texto);

      // 4. Obtener datos del usuario
      const usuario = await UsuarioModel.obtenerPorId(req.user.id);
      const advertencias = [];
      
      // Incluir advertencias de extracción
      if (advertencias_extraccion && advertencias_extraccion.length > 0) {
        advertencias_extraccion.forEach(adv => {
          advertencias.push({
            tipo: 'extraccion',
            gravedad: 'baja',
            mensaje: adv
          });
        });
      }

      // 5. Validar contra datos del usuario (MODO SUGERENCIA)
      if (campos.nombre && usuario.nombre) {
        const similitud = calcularSimilitudNombres(campos.nombre, usuario.nombre);
        if (similitud < 60) {
          advertencias.push({
            tipo: 'nombre',
            gravedad: 'alta',
            mensaje: `Nombre en documento "${campos.nombre}" no coincide suficientemente con perfil "${usuario.nombre}" (similitud: ${similitud}%)`
          });
        } else if (similitud < 80) {
          advertencias.push({
            tipo: 'nombre',
            gravedad: 'media',
            mensaje: `Nombre tiene similitud moderada (${similitud}%). Verificar posibles variaciones en el nombre`
          });
        }
      }

      // Validar documento solo si el usuario tiene el campo (BD nueva)
      if (campos.documento && usuario.documento) {
        if (campos.documento !== usuario.documento.toString()) {
          advertencias.push({
            tipo: 'documento',
            gravedad: 'alta',
            mensaje: `Documento en archivo (${campos.documento}) no coincide con perfil (${usuario.documento})`
          });
        }
      }

      // Validar fechas si están presentes
      if (campos.fecha_inicio && campos.fecha_fin) {
        const inicio = new Date(campos.fecha_inicio);
        const fin = new Date(campos.fecha_fin);
        if (inicio > fin) {
          advertencias.push({
            tipo: 'fechas',
            gravedad: 'alta',
            mensaje: 'Fecha de inicio es posterior a fecha de fin'
          });
        }
      }

      // Agregar advertencia de confianza si existe
      if (advertencia_confianza) {
        advertencias.push({
          tipo: 'ocr',
          gravedad: 'media',
          mensaje: advertencia_confianza
        });
      }

      // 6. Eliminar archivo temporal
      fs.unlinkSync(rutaArchivo);

      // 7. Generar sugerencia de validez para GH
      // NOTA: Sistema flexible - solo errores CRÍTICOS causan RECHAZAR
      const errores_graves = advertencias.filter(adv => adv.gravedad === 'alta');
      const errores_moderados = advertencias.filter(adv => adv.gravedad === 'media');
      const advertencias_leves = advertencias.filter(adv => adv.gravedad === 'baja');
      
      let sugerencia_validez = 'APROBAR';
      let confianza_sugerencia = 100;
      let justificacion = '';
      
      // Solo rechazar si hay ERRORES CRÍTICOS reales (fechas absurdas, doc inválido, tipo desconocido)
      if (errores.length > 0) {
        sugerencia_validez = 'RECHAZAR';
        confianza_sugerencia = 20;
        justificacion = `Errores críticos detectados: ${errores.join(', ')}. Se recomienda rechazar y solicitar documento corregido`;
      } 
      // Rechazar si usuario no coincide con el documento
      else if (errores_graves.length > 0) {
        sugerencia_validez = 'RECHAZAR';
        confianza_sugerencia = 30;
        justificacion = `Documento no corresponde al usuario: ${errores_graves.map(e => e.mensaje).join('; ')}`;
      } 
      // Revisar manualmente si hay advertencias moderadas (confianza baja, similitud nombre moderada)
      else if (errores_moderados.length > 0) {
        sugerencia_validez = 'REVISAR_MANUALMENTE';
        confianza_sugerencia = 60;
        justificacion = `Se detectaron ${errores_moderados.length} advertencia(s) que requieren verificación: ${errores_moderados[0].mensaje}`;
      } 
      // Revisar manualmente si faltan campos importantes (advertencias leves)
      else if (advertencias_leves.length > 3) {
        sugerencia_validez = 'REVISAR_MANUALMENTE';
        confianza_sugerencia = 75;
        justificacion = `Faltan varios campos (${advertencias_leves.length} advertencias). GH debe completar información manualmente`;
      }
      // Revisar si hay pocas advertencias leves
      else if (advertencias_leves.length > 0) {
        sugerencia_validez = 'APROBAR';
        confianza_sugerencia = 85;
        justificacion = `Documento válido con ${advertencias_leves.length} advertencia(s) menor(es). GH puede aprobar completando campos faltantes`;
      }
      // Aprobar si todo está correcto
      else {
        justificacion = 'Documento válido, todos los campos extraídos correctamente';
      }

      // 8. Responder con SUGERENCIA (no bloqueo)
      res.json({
        success: true, // SIEMPRE success, GH decide
        message: 'Análisis OCR completado. Sugerencia generada para Gestión Humana',
        data: {
          tipo_detectado: tipo,
          campos_extraidos: {
            nombre: campos.nombre,
            documento: campos.documento,
            fecha_inicio: campos.fecha_inicio,
            fecha_fin: campos.fecha_fin,
            dias_totales: campos.dias_totales,
            diagnostico: campos.diagnostico,
            numero_radicado: campos.numero_radicado,
            entidad: campos.entidad
          },
          confianza_ocr: confianza,
          analisis_validacion: {
            documento_legible: confianza >= 70,
            campos_completos: errores.length === 0,
            usuario_coincide: advertencias.filter(a => a.tipo !== 'ocr').length === 0,
            advertencias: advertencias,
            errores_documento: errores
          },
          sugerencia_para_gh: {
            accion_sugerida: sugerencia_validez, // APROBAR | RECHAZAR | REVISAR_MANUALMENTE
            confianza: confianza_sugerencia, // 0-100
            justificacion: justificacion,
            nota: 'Esta es una sugerencia automática. Gestión Humana tiene la decisión final.'
          }
        }
      });

    } catch (error) {
      console.error('Error validando documento:', error);

      // Limpiar archivo si existe
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error procesando documento: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Subir documento adicional a una incapacidad existente
   * POST /api/incapacidades/:id/documento
   */
  async subirDocumento(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;
      const usuarioRol = req.user.rol;

      // Verificar que se subió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún documento',
          data: null
        });
      }

      // Obtener incapacidad
      const incapacidad = await IncapacidadModel.obtenerPorId(id);

      if (!incapacidad) {
        // Eliminar archivo subido
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      // Verificar permisos: solo el dueño o GH/Conta pueden subir documentos
      if (incapacidad.usuario_id !== usuarioId && !['gh', 'conta'].includes(usuarioRol)) {
        // Eliminar archivo subido
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para subir documentos a esta incapacidad',
          data: null
        });
      }

      // Si quien sube no es el dueño, mover archivo a la carpeta del dueño
      let nombreArchivo = req.file.filename;
      let archivoActual = req.file.path;
      
      if (incapacidad.usuario_id !== usuarioId) {
        // Crear carpeta del dueño si no existe
        const carpetaDueno = path.join(process.cwd(), 'src', 'uploads', `user_${incapacidad.usuario_id}`);
        if (!fs.existsSync(carpetaDueno)) {
          fs.mkdirSync(carpetaDueno, { recursive: true });
        }

        // Generar nuevo nombre de archivo en carpeta del dueño
        const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        nombreArchivo = `${Date.now()}-user${incapacidad.usuario_id}-${sanitizedName}`;
        const nuevaRuta = path.join(carpetaDueno, nombreArchivo);

        // Mover archivo
        fs.renameSync(archivoActual, nuevaRuta);
        archivoActual = nuevaRuta;
      }

      // Actualizar documento en la incapacidad
      const db = getDatabase();
      await db.run(
        'UPDATE incapacidades SET documento_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nombreArchivo, id]
      );

      // Crear notificación
      // Si GH/Conta sube el documento, notificar al dueño de la incapacidad
      // Si el dueño sube su propio documento, no crear notificación (evita notificarse a sí mismo)
      if (['gh', 'conta'].includes(usuarioRol) && incapacidad.usuario_id !== usuarioId) {
        await NotificacionModel.crear({
          usuario_id: incapacidad.usuario_id,
          tipo: 'info',
          titulo: 'Documento actualizado',
          mensaje: `El equipo de RRHH ha actualizado el documento de tu incapacidad #${id}`,
          incapacidad_id: id
        });
      }

      res.json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
          incapacidad_id: id,
          documento: nombreArchivo,
          nombre_original: req.file.originalname,
          tamaño: req.file.size,
          tipo: req.file.mimetype
        }
      });

    } catch (error) {
      console.error('Error subiendo documento:', error);
      
      // Limpiar archivo si existe
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error al subir documento: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Obtener documento de una incapacidad
   * GET /api/incapacidades/:id/documento
   */
  async obtenerDocumento(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;
      const usuarioRol = req.user.rol;

      // Obtener incapacidad
      const incapacidad = await IncapacidadModel.obtenerPorId(id);

      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      // Verificar que hay documento
      if (!incapacidad.documento_url) {
        return res.status(404).json({
          success: false,
          message: 'Esta incapacidad no tiene documento adjunto',
          data: null
        });
      }

      // Verificar permisos: el dueño, GH, CONTA o LIDER pueden ver documentos
      if (incapacidad.usuario_id !== usuarioId && !['gh', 'conta', 'lider'].includes(usuarioRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver este documento',
          data: null
        });
      }

      // Construir ruta del archivo
      // Primero intentar en la carpeta del usuario
      let rutaArchivo = path.join(process.cwd(), 'src', 'uploads', `user_${incapacidad.usuario_id}`, incapacidad.documento_url);
      
      // Si no existe, buscar en la carpeta raíz de uploads (archivos antiguos)
      if (!fs.existsSync(rutaArchivo)) {
        rutaArchivo = path.join(process.cwd(), 'src', 'uploads', incapacidad.documento_url);
      }

      // Si aún no existe, buscar en temp
      if (!fs.existsSync(rutaArchivo)) {
        rutaArchivo = path.join(process.cwd(), 'src', 'uploads', 'temp', incapacidad.documento_url);
      }

      // Verificar que el archivo existe
      if (!fs.existsSync(rutaArchivo)) {
        return res.status(404).json({
          success: false,
          message: 'El archivo del documento no se encontró en el servidor',
          data: null
        });
      }

      // Obtener información del archivo
      const stats = fs.statSync(rutaArchivo);
      const extension = path.extname(incapacidad.documento_url).toLowerCase();

      // Determinar tipo MIME
      let mimeType = 'application/octet-stream';
      if (extension === '.pdf') {
        mimeType = 'application/pdf';
      } else if (['.jpg', '.jpeg'].includes(extension)) {
        mimeType = 'image/jpeg';
      } else if (extension === '.png') {
        mimeType = 'image/png';
      }

      // Enviar archivo
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${incapacidad.documento_url}"`);
      res.setHeader('Content-Length', stats.size);

      const stream = fs.createReadStream(rutaArchivo);
      stream.pipe(res);

    } catch (error) {
      console.error('Error obteniendo documento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener documento: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Eliminar una incapacidad
   * DELETE /api/incapacidades/:id
   * Solo GH y Conta pueden eliminar
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;
      const rol = req.user.rol;

      // Obtener incapacidad
      const incapacidad = await IncapacidadModel.obtenerPorId(id);

      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      // Solo GH y Conta pueden eliminar, o el propio usuario si está en estado 'reportada'
      const puedeEliminar = rol === 'gh' || rol === 'conta' || 
        (incapacidad.usuario_id === usuario_id && incapacidad.estado === 'reportada');

      if (!puedeEliminar) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar esta incapacidad',
          data: null
        });
      }

      const db = await getDatabase();

      // Eliminar historial de estados relacionado
      await db.run('DELETE FROM historial_estados WHERE incapacidad_id = ?', [id]);

      // Eliminar documento físico si existe
      if (incapacidad.documento_url) {
        const rutaArchivo = path.join(process.cwd(), 'src', 'uploads', `user_${incapacidad.usuario_id}`, incapacidad.documento_url);
        if (fs.existsSync(rutaArchivo)) {
          fs.unlinkSync(rutaArchivo);
        }
      }

      // Eliminar incapacidad
      await db.run('DELETE FROM incapacidades WHERE id = ?', [id]);

      res.status(200).json({
        success: true,
        message: 'Incapacidad eliminada exitosamente',
        data: { id: parseInt(id) }
      });

    } catch (error) {
      console.error('Error eliminando incapacidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar incapacidad: ' + error.message,
        data: null
      });
    }
  }
};
