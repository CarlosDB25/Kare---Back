# KARE - Tests de Produccion

Suite de tests automatizados para API en produccion (Render.com) con limpieza automatica de BD.

## Estructura

- `ejecutar-todos.ps1` - Script principal (incluye limpieza automatica)
- `limpiar-bd.ps1` - Limpieza manual de incapacidades de test
- `tests/` - Modulos de tests organizados por categoria
  - `01-autenticacion.ps1` - 14 tests
  - `02-control-acceso.ps1` - 7 tests
  - `03-incapacidades.ps1` - 8 tests
  - `04-validaciones.ps1` - 7 tests
  - `05-estados.ps1` - 6 tests
  - `06-notificaciones.ps1` - 2 tests
  - `07-rendimiento.ps1` - 4 tests

## Uso

```powershell
cd tests-produccion
.\ejecutar-todos.ps1   # Limpia BD automaticamente y ejecuta tests
.\limpiar-bd.ps1       # Solo limpiar BD sin ejecutar tests
```

## Estado Actual

**Total: 48 tests**
**Exito: 91.67% (44/48 pasando)**

### Tests fallidos (4)

Errores 500 del API (bugs del servidor):
- Test 34: Validacion sin diagnostico
- Tests 38-40: Cambio de estados de incapacidades

### Limpieza automatica

El script `ejecutar-todos.ps1` ahora limpia automaticamente todas las incapacidades de test antes de ejecutar la suite. Esto evita:
- Solapamiento de fechas con datos de ejecuciones anteriores
- Llenado innecesario de la BD de produccion
- Falsos positivos en tests de creacion

Las incapacidades de test se identifican por patron en diagnostico: `AT-`, `Test`, `AutoTest`, `Debug`

### Mejoras implementadas

1. **Endpoint DELETE** agregado al API para eliminar incapacidades
2. **Limpieza automatica** antes de cada ejecucion
3. **Fechas dinamicas** basadas en DayOfYear % 50 para evitar colisiones
4. **Separacion de usuarios** (Colab1, Colab2) para tests independientes
