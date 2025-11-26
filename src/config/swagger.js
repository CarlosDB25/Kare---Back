import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Configuración de Swagger/OpenAPI 3.0
 * Documentación interactiva de la API KARE
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KARE API - Sistema de Gestión de Incapacidades Laborales',
      version: '1.3.0',
      description: `
**API REST completa para gestionar incapacidades laborales con:**
- ✅ Autenticación JWT
- ✅ OCR automático (Tesseract.js + pdf-parse)
- ✅ Validaciones robustas (18+ reglas de negocio)
- ✅ Sistema de notificaciones en tiempo real
- ✅ Conciliaciones financieras automáticas
- ✅ Gestión de reemplazos temporales
- ✅ Control de acceso por roles (GH, Contabilidad, Líder, Colaborador)

**Desarrollado por:** Equipo KARE  
**Repositorio:** [GitHub - Kare Backend](https://github.com/CarlosDB25/Kare---Back)  
**Documentación completa:** Ver carpeta /docs en el repositorio
      `,
      contact: {
        name: 'Soporte KARE',
        email: 'soporte@kare.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://kare-back.onrender.com/api',
        description: '🌐 Servidor de Producción (24/7)'
      },
      {
        url: 'http://localhost:3000/api',
        description: '💻 Servidor de Desarrollo Local'
      }
    ],
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints de registro, login y perfil de usuario'
      },
      {
        name: 'Incapacidades',
        description: 'CRUD completo de incapacidades + OCR + validaciones automáticas'
      },
      {
        name: 'Notificaciones',
        description: 'Sistema de notificaciones en tiempo real'
      },
      {
        name: 'Conciliaciones',
        description: 'Cálculos financieros y estadísticas (solo Contabilidad/GH)'
      },
      {
        name: 'Reemplazos',
        description: 'Gestión de reemplazos temporales (solo Líderes/GH)'
      },
      {
        name: 'Usuarios',
        description: 'Administración de usuarios (solo GH/Contabilidad)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtenido del endpoint `/auth/login`. Formato: `Bearer {token}`'
        }
      },
      schemas: {
        // Schema: Usuario
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', example: 'juan@kare.com' },
            rol: { type: 'string', enum: ['gh', 'conta', 'lider', 'colaborador'], example: 'colaborador' },
            documento: { type: 'string', example: '1234567890' },
            cargo: { type: 'string', example: 'Desarrollador' },
            salario_base: { type: 'number', example: 3000000 },
            ibc: { type: 'number', example: 3000000 },
            area: { type: 'string', example: 'Operaciones' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        // Schema: Incapacidad
        Incapacidad: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            usuario_id: { type: 'integer', example: 4 },
            tipo: { 
              type: 'string', 
              enum: ['EPS', 'ARL', 'Licencia_Maternidad', 'Licencia_Paternidad'],
              example: 'EPS'
            },
            diagnostico: { type: 'string', example: 'J06.9 Infección Respiratoria Aguda' },
            fecha_inicio: { type: 'string', format: 'date', example: '2025-11-20' },
            fecha_fin: { type: 'string', format: 'date', example: '2025-11-25' },
            dias_totales: { type: 'integer', example: 6 },
            estado: { 
              type: 'string', 
              enum: ['reportada', 'en_revision', 'validada', 'rechazada', 'pagada'],
              example: 'reportada'
            },
            documento_url: { type: 'string', example: '1732567890123-incapacidad.pdf' },
            observaciones: { type: 'string', example: 'Revisión por GH necesaria' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        // Schema: Notificacion
        Notificacion: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            usuario_id: { type: 'integer', example: 4 },
            tipo: { type: 'string', enum: ['info', 'success', 'warning', 'error'], example: 'info' },
            titulo: { type: 'string', example: 'Incapacidad validada' },
            mensaje: { type: 'string', example: 'Tu incapacidad #1 ha sido validada por GH' },
            incapacidad_id: { type: 'integer', example: 1 },
            leida: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Schema: Conciliacion
        Conciliacion: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            incapacidad_id: { type: 'integer', example: 1 },
            dias_incapacidad: { type: 'integer', example: 6 },
            salario_base: { type: 'number', example: 3000000 },
            ibc: { type: 'number', example: 3000000 },
            valor_dia: { type: 'number', example: 100000 },
            dias_empresa_67: { type: 'integer', example: 2 },
            monto_empresa_67: { type: 'number', example: 133340 },
            dias_eps_100: { type: 'integer', example: 4 },
            monto_eps_100: { type: 'number', example: 266680 },
            total_a_pagar: { type: 'number', example: 400020 },
            estado_pago: { type: 'string', enum: ['pendiente', 'aprobado', 'pagado', 'rechazado'], example: 'pendiente' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Schema: Reemplazo
        Reemplazo: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            incapacidad_id: { type: 'integer', example: 1 },
            colaborador_reemplazo_id: { type: 'integer', example: 6 },
            fecha_inicio: { type: 'string', format: 'date', example: '2025-11-20' },
            fecha_fin: { type: 'string', format: 'date', example: '2025-11-25' },
            estado: { type: 'string', enum: ['activo', 'finalizado', 'cancelado'], example: 'activo' },
            observaciones: { type: 'string', example: 'Reemplazo temporal' },
            created_by: { type: 'integer', example: 3 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Respuesta estándar exitosa
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data: { type: 'object' }
          }
        },

        // Respuesta estándar de error
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error en la solicitud' },
            data: { type: 'null', example: null }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controller/*.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
