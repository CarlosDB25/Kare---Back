# 📋 CAMBIOS POR NORMATIVA LEGAL COLOMBIANA

**Fecha de actualización:** 20 de noviembre de 2025  
**Versión del sistema:** 1.1.0

---

## 🏛️ NORMATIVA APLICADA

El sistema KARE ha sido actualizado para cumplir estrictamente con la normativa laboral colombiana vigente en materia de incapacidades y licencias:

### Documentos legales de referencia:

1. **Incapacidad por Enfermedad General (EPS - Origen Común)**
   - Día 1-2: Empleador paga **66.67%** del salario (2/3 del salario según CST)
   - Día 3-90: EPS paga **66.67%** del IBC (valor mínimo: SMLV proporcional)
   - Día 91-180: EPS paga **50%** del IBC (aplica si trabajador aún no está en valoración de pérdida de capacidad laboral)
   - Día 181-540: Fondo de Pensiones para definición de invalidez

2. **Incapacidad por Origen Laboral (ARL - Accidente o Enfermedad Laboral)**
   - Desde día 1: ARL paga **100%** del IBC sin excepciones

3. **Licencia de Maternidad (Ley 1822 de 2017)**
   - 126 días (18 semanas): EPS paga **100%** del IBC
   - IBC usado debe ser como mínimo un SMLV

4. **Licencia de Paternidad (Ley 1468 de 2011)**
   - Hasta 14 días: EPS paga **100%** del IBC
   - Si hubo cotización incompleta durante embarazo, puede ser proporcional

---

## 🔧 CAMBIOS IMPLEMENTADOS EN EL SISTEMA

### 1. ✅ Nuevos Tipos de Incapacidad

**ANTES:**
```javascript
Tipos: ['EPS', 'ARL', 'Licencia']
```

**AHORA:**
```javascript
Tipos: ['EPS', 'ARL', 'Licencia_Maternidad', 'Licencia_Paternidad']
```

### 2. ✅ Límites de Días Actualizados

| Tipo | Días Mínimos | Días Máximos | Cambio |
|------|--------------|--------------|--------|
| **EPS** | 1 | 180 | ✅ Sin cambios (conforme a ley) |
| **ARL** | 1 | 540 | ✅ Sin cambios (18 meses, conforme a ley) |
| **Licencia_Maternidad** | 1 | 126 | ⭐ NUEVO (18 semanas, Ley 1822/2017) |
| **Licencia_Paternidad** | 1 | 14 | ⭐ NUEVO (Ley 1468/2011) |

### 3. ✅ Porcentajes de Pago Actualizados (EPS)

**ANTES (INCORRECTO):**
```
Día 1-2: Empresa paga 100%
Día 3+: EPS paga 66.67%
```

**AHORA (CONFORME A LEY):**
```
Día 1-2: Empleador paga 66.67% (2/3 del salario según CST)
Día 3-90: EPS paga 66.67% del IBC
Día 91-180: EPS paga 50% del IBC
Día 181+: Remite a Fondo de Pensiones
```

### 4. ✅ Cálculo de Conciliaciones Actualizado

El módulo `calcularConciliacion()` ahora implementa la normativa correcta:

**Ejemplo: Incapacidad EPS de 100 días (IBC: $3,000,000)**

```javascript
// Desglose detallado:
{
  tramo_1: {
    dias: "1-2",
    cantidad_dias: 2,
    porcentaje: 66.67,
    quien_paga: "Empleador",
    valor: $133,340
  },
  tramo_2: {
    dias: "3-90",
    cantidad_dias: 88,
    porcentaje: 66.67,
    quien_paga: "EPS",
    valor: $5,866,960
  },
  tramo_3: {
    dias: "91-100",
    cantidad_dias: 10,
    porcentaje: 50.00,
    quien_paga: "EPS",
    valor: $500,000,
    nota: "Aplica si aún no está en valoración de pérdida de capacidad laboral"
  },
  valor_total: $6,500,300
}
```

**Ejemplo: Incapacidad ARL de 30 días (IBC: $3,000,000)**

```javascript
{
  tramo_1: {
    dias: "1-30",
    cantidad_dias: 30,
    porcentaje: 100.00,
    quien_paga: "ARL",
    valor: $3,000,000,
    nota: "ARL paga 100% desde el primer día sin excepciones"
  },
  valor_total: $3,000,000
}
```

**Ejemplo: Licencia de Maternidad de 126 días (IBC: $3,000,000)**

```javascript
{
  tramo_1: {
    dias: "1-126",
    cantidad_dias: 126,
    porcentaje: 100.00,
    quien_paga: "EPS",
    valor: $12,600,000,
    nota: "Licencia de Maternidad: 100% del IBC por 126 días (mínimo 1 SMLV)"
  },
  valor_total: $12,600,000
}
```

### 5. ⭐ OCR: De Validación a Sugerencia

**CAMBIO MÁS IMPORTANTE:**

El sistema OCR ahora **NO bloquea** la creación de incapacidades. En su lugar, **genera sugerencias** para que Gestión Humana tome la decisión final.

**ANTES:**
```javascript
// OCR rechazaba automáticamente si confianza < 70%
if (confianza < 70) {
  return res.status(400).json({
    success: false,
    message: "Documento no legible"
  });
}
```

**AHORA:**
```javascript
// OCR sugiere, pero GH decide
{
  success: true, // SIEMPRE permite continuar
  sugerencia_para_gh: {
    accion_sugerida: "APROBAR" | "RECHAZAR" | "REVISAR_MANUALMENTE",
    confianza: 85, // 0-100
    justificacion: "Documento válido, todos los campos coinciden",
    nota: "Esta es una sugerencia automática. GH tiene la decisión final."
  }
}
```

**Niveles de sugerencia:**

| Acción Sugerida | Confianza | Cuándo se genera |
|-----------------|-----------|------------------|
| **APROBAR** | 100% | ✅ Sin errores graves ni advertencias. Documento legible, campos completos, datos coinciden |
| **REVISAR_MANUALMENTE** | 60-70% | ⚠️ Advertencias moderadas (confianza OCR <70%, campos incompletos, similitud nombre <80%) |
| **RECHAZAR** | 25% | ❌ Errores graves (documento no coincide con usuario, fechas inválidas, datos inconsistentes) |

**Ventajas del cambio:**

1. ✅ **Flexibilidad**: GH puede aprobar documentos con baja confianza OCR si son legibles manualmente
2. ✅ **Reduce falsos rechazos**: Documentos válidos con mala calidad de escaneo no se bloquean
3. ✅ **Trazabilidad**: Sistema registra sugerencia OCR, pero la decisión final queda documentada como responsabilidad de GH
4. ✅ **Mejor UX**: Usuarios no reciben rechazos automáticos frustrantes

---

## 📊 COMPARACIÓN DE CÁLCULOS

### Caso de Estudio: Incapacidad EPS de 5 días (IBC: $3,000,000)

**Sistema ANTERIOR (INCORRECTO):**
```
Día 1-2 (Empresa 100%): $100,000/día × 2 = $200,000
Día 3-5 (EPS 66.67%): $100,000/día × 3 × 0.6667 = $200,010
TOTAL: $400,010
```

**Sistema ACTUAL (CONFORME A LEY):**
```
Día 1-2 (Empleador 66.67%): $100,000/día × 2 × 0.6667 = $133,340
Día 3-5 (EPS 66.67%): $100,000/día × 3 × 0.6667 = $200,010
TOTAL: $333,350
```

**Diferencia:** $66,660 menos (ajuste correcto según normativa)

---

## 🔄 MIGRACIÓN DE DATOS EXISTENTES

### Recomendaciones:

1. **Incapacidades tipo "Licencia":**
   - Revisar manualmente si son maternidad o paternidad
   - Actualizar tipo a `Licencia_Maternidad` o `Licencia_Paternidad`
   - Recalcular conciliaciones afectadas

2. **Conciliaciones antiguas (cálculo incorrecto):**
   - Las conciliaciones ya pagadas NO se modifican (mantener histórico)
   - Nuevas conciliaciones usan cálculo correcto automáticamente
   - Agregar campo `normativa_aplicada` para identificar método de cálculo

3. **OCR validaciones antiguas:**
   - Historial de validaciones OCR se mantiene
   - Nueva estructura de respuesta incluye `sugerencia_para_gh`
   - Frontend debe adaptarse para mostrar sugerencias, no bloqueos

---

## 📝 ENDPOINTS ACTUALIZADOS

### POST /api/incapacidades/validar-documento

**Respuesta nueva estructura:**

```json
{
  "success": true,
  "message": "Análisis OCR completado. Sugerencia generada para Gestión Humana",
  "data": {
    "tipo_detectado": "EPS",
    "campos_extraidos": {
      "nombre": "Juan Pablo Martínez",
      "documento": "1234567890",
      "fecha_inicio": "2025-11-20",
      "fecha_fin": "2025-11-24",
      "dias_incapacidad": 5,
      "diagnostico": "Gripe",
      "entidad": "EPS Sura"
    },
    "confianza_ocr": 87,
    "analisis_validacion": {
      "documento_legible": true,
      "campos_completos": true,
      "usuario_coincide": true,
      "advertencias": [],
      "errores_documento": []
    },
    "sugerencia_para_gh": {
      "accion_sugerida": "APROBAR",
      "confianza": 100,
      "justificacion": "Documento válido, todos los campos coinciden correctamente",
      "nota": "Esta es una sugerencia automática. Gestión Humana tiene la decisión final."
    }
  }
}
```

### POST /api/conciliaciones

**Respuesta nueva estructura (incluye desglose detallado):**

```json
{
  "success": true,
  "message": "Conciliación creada exitosamente",
  "data": {
    "id": 1,
    "incapacidad_id": 1,
    "dias_incapacidad": 100,
    "ibc": 3000000,
    "valor_dia": 100000,
    "dias_empresa": 2,
    "valor_empresa": 133340,
    "dias_eps": 98,
    "valor_eps": 6366960,
    "valor_total": 6500300,
    "desglose_detallado": [
      {
        "dias": "1-2",
        "cantidad_dias": 2,
        "porcentaje": 66.67,
        "quien_paga": "Empleador",
        "valor": 133340
      },
      {
        "dias": "3-90",
        "cantidad_dias": 88,
        "porcentaje": 66.67,
        "quien_paga": "EPS",
        "valor": 5866960
      },
      {
        "dias": "91-100",
        "cantidad_dias": 10,
        "porcentaje": 50.00,
        "quien_paga": "EPS",
        "valor": 500000,
        "nota": "Aplica si aún no está en valoración de pérdida de capacidad laboral"
      }
    ],
    "normativa_aplicada": "Enfermedad General - Origen Común"
  }
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Para Desarrolladores:

- [x] Actualizar `validationService.js` con nuevos tipos y límites
- [x] Actualizar `Conciliacion.js` con cálculo correcto por tramos
- [x] Modificar `incapacidadController.js` para OCR en modo sugerencia
- [x] Agregar función `calcularPorcentajesPago()` con normativa legal
- [x] Documentar cambios en `CAMBIOS_NORMATIVA_LEGAL.md`
- [ ] Actualizar tests para validar nuevos cálculos
- [ ] Actualizar documentación técnica completa
- [ ] Crear script de migración de datos (si aplica)

### Para Frontend:

- [ ] Actualizar formulario de incapacidades con nuevos tipos
- [ ] Modificar UI de OCR para mostrar "sugerencias" en vez de "errores"
- [ ] Agregar visualización de desglose de conciliación por tramos
- [ ] Actualizar validaciones de formulario con nuevos límites
- [ ] Mostrar campo "normativa_aplicada" en detalle de conciliación

### Para QA/Testing:

- [ ] Probar creación de incapacidades con 4 tipos diferentes
- [ ] Verificar cálculos de conciliación EPS con >90 días
- [ ] Validar que OCR ya NO bloquea documentos (solo sugiere)
- [ ] Comprobar límites de Licencia_Maternidad (126 días)
- [ ] Comprobar límites de Licencia_Paternidad (14 días)

---

## 🚀 DESPLIEGUE

### Comandos para aplicar cambios:

```powershell
# 1. Pull de cambios
git pull origin main

# 2. Instalar dependencias (si hay nuevas)
npm install

# 3. Reiniciar servidor
npm run dev

# 4. Verificar logs
# Revisar que no haya errores en cálculos
```

### Verificación rápida:

```bash
# Test de tipos nuevos
curl -X POST http://localhost:3000/api/incapacidades \
  -H "Authorization: Bearer TOKEN" \
  -d '{"tipo":"Licencia_Maternidad","fecha_inicio":"2025-11-20","fecha_fin":"2026-03-25","dias":126}'

# Test de cálculo EPS >90 días
# Crear incapacidad de 100 días
# Crear conciliación
# Verificar que desglose tenga 3 tramos
```

---

## 📚 REFERENCIAS LEGALES

- **Código Sustantivo del Trabajo (CST)** - Artículo sobre auxilio de incapacidad
- **Ley 1822 de 2017** - Licencia de Maternidad (18 semanas)
- **Ley 1468 de 2011** - Licencia de Paternidad
- **Decreto 1295 de 1994** - Sistema General de Riesgos Laborales (ARL)
- **Ley 100 de 1993** - Sistema General de Seguridad Social en Salud (EPS)

---

## 📞 SOPORTE

Para dudas sobre la normativa legal aplicada o cálculos del sistema:

- **Equipo de Desarrollo KARE**
- **Asesoría Jurídica Laboral**
- **Departamento de Gestión Humana**

---

**Sistema KARE v1.1.0** - Conforme a normativa laboral colombiana 2025 ✅
