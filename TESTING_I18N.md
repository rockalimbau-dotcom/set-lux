# Guía de Testing - Internacionalización (i18n)

## Paso 10: Testing de Traducciones

### Checklist de Pruebas

#### 1. Cambiar idioma en Configuración
- [ ] Ir a `/settings`
- [ ] Seleccionar "Español" → Verificar que todos los textos están en español
- [ ] Seleccionar "English" → Verificar que todos los textos están en inglés
- [ ] Seleccionar "Català" → Verificar que todos los textos están en catalán
- [ ] El cambio debe ser **instantáneo** (sin necesidad de guardar)

#### 2. Cambiar idioma en Registro
- [ ] Ir a la página de registro
- [ ] Seleccionar un idioma en el dropdown
- [ ] Verificar que la interfaz cambia **inmediatamente** al idioma seleccionado
- [ ] Completar el registro
- [ ] Verificar que el idioma se mantiene después del registro

#### 3. Persistencia del idioma
- [ ] Cambiar el idioma a "English" en Configuración
- [ ] Recargar la página (F5 o Cmd+R)
- [ ] Verificar que el idioma se mantiene en "English"
- [ ] Cerrar y abrir el navegador
- [ ] Verificar que el idioma sigue siendo "English"

#### 4. Verificar traducciones en todas las secciones

##### 4.1 Autenticación (Login/Registro)
- [ ] Todos los labels están traducidos
- [ ] Todos los placeholders están traducidos
- [ ] Mensajes de error están traducidos
- [ ] Mensajes de éxito están traducidos
- [ ] Botones están traducidos

##### 4.2 Proyectos
- [ ] Títulos de página están traducidos
- [ ] Labels de tarjetas (DoP, Almacén, Productora) están traducidos
- [ ] Estados (Activo, Cerrado) están traducidos
- [ ] Modales de creación/edición están traducidos
- [ ] Mensajes de confirmación están traducidos

##### 4.3 Condiciones
- [ ] Títulos de secciones están traducidos
- [ ] Labels de parámetros están traducidos
- [ ] Textos por defecto en textareas están traducidos
- [ ] Botones están traducidos
- [ ] Roles en dropdowns están traducidos
- [ ] Mensajes de confirmación están traducidos

##### 4.4 Equipo
- [ ] Títulos de grupos están traducidos
- [ ] Botones están traducidos
- [ ] Roles están traducidos
- [ ] Mensajes de confirmación están traducidos
- [ ] Tip message está traducido

##### 4.5 Planificación
- [ ] Títulos de semanas están traducidos (Semana 1 → Week 1)
- [ ] Días de la semana están traducidos
- [ ] Tipos de jornada están traducidos
- [ ] Labels de tabla están traducidos
- [ ] Botones están traducidos
- [ ] Mensajes de localización (Descanso, Fin) están traducidos

##### 4.6 Reportes
- [ ] Títulos de meses están traducidos
- [ ] Días de la semana están traducidos
- [ ] Conceptos (Horas extra, Turn Around, etc.) están traducidos
- [ ] Opciones de dietas están traducidas
- [ ] Botones están traducidos
- [ ] Mensajes están traducidos

##### 4.7 Nómina
- [ ] Títulos de meses están traducidos
- [ ] Headers de tabla están traducidos
- [ ] Conceptos están traducidos
- [ ] Opciones de dietas están traducidas
- [ ] Mensajes de configuración están traducidos
- [ ] Exportación PDF está traducida

##### 4.8 Necesidades
- [ ] Labels de campos están traducidos
- [ ] Días de la semana están traducidos
- [ ] Títulos de semanas están traducidos
- [ ] Localización (Descanso, Fin) está traducida
- [ ] Botones están traducidos
- [ ] Exportación PDF está traducida

##### 4.9 Configuración
- [ ] Todos los textos están traducidos
- [ ] Selector de idioma funciona correctamente
- [ ] Mensaje de éxito está traducido

##### 4.10 Perfil
- [ ] Todos los labels están traducidos
- [ ] Placeholders están traducidos
- [ ] Mensaje de éxito está traducido

#### 5. Verificar interpolación de variables
- [ ] Mensaje de bienvenida con nombre: `{t('common.hello', { name: userName })}`
- [ ] Mensajes con contadores: `{t('payroll.weeksWithoutTeam', { count, plural })}`
- [ ] Mensajes de confirmación con nombres: `{t('team.confirmDeleteMember', { name })}`
- [ ] Copyright con año: `{t('footer.copyright', { year })}`
- [ ] Semanas con número: `{t('planning.weekFormat', { number })}`

#### 6. Verificar mensajes de error
- [ ] Error de registro: "Por favor, completa todos los campos."
- [ ] Error de contraseña: "Las contraseñas no coinciden."
- [ ] ErrorBoundary muestra mensajes traducidos
- [ ] Errores en Necesidades están traducidos

#### 7. Verificar mensajes de éxito
- [ ] Registro exitoso: "Registro completado con éxito ✅"
- [ ] Configuración guardada: "Configuración guardada ✓"
- [ ] Perfil guardado: "Perfil guardado ✓"

#### 8. Verificar exportaciones PDF
- [ ] Exportar nómina en PDF → Verificar que está traducida
- [ ] Exportar condiciones en PDF → Verificar que está traducida
- [ ] Exportar necesidades en PDF → Verificar que está traducida
- [ ] Exportar reportes en PDF → Verificar que está traducida

#### 9. Probar en diferentes navegadores
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Verificar que el idioma se detecta correctamente del navegador (si no hay preferencia guardada)

#### 10. Verificar detección automática de idioma
- [ ] Limpiar localStorage y profile_v1
- [ ] Recargar la página
- [ ] Verificar que detecta el idioma del navegador
- [ ] Si el navegador está en inglés → debe mostrar inglés
- [ ] Si el navegador está en catalán → debe mostrar catalán
- [ ] Si no coincide → debe mostrar español (fallback)

### Notas importantes
- El idioma se guarda en `profile_v1` con la clave `idioma`
- El idioma también se guarda en `localStorage` con la clave `i18nextLng`
- El cambio de idioma es **instantáneo** en Configuración y Registro
- Todos los textos visibles al usuario deben estar traducidos
- Los mensajes de consola (`console.log`, `console.error`) NO necesitan traducción

### Archivos de traducción
- `src/locales/es.json` - Español
- `src/locales/en.json` - Inglés
- `src/locales/ca.json` - Catalán

### Configuración
- `src/i18n/config.ts` - Configuración de i18next
- `src/main.tsx` - Inicialización de i18n

