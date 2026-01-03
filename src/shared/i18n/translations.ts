export type Language = 'Español' | 'Catalán' | 'Inglés';

export interface Translations {
  // Botones comunes
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  back: string;
  next: string;
  close: string;
  yes: string;
  no: string;
  
  // Auth (Login/Registro)
  auth: {
    user: string;
    password: string;
    login: string;
    register: string;
    noAccount: string;
    signUp: string;
    name: string;
    lastName: string;
    role: string;
    language: string;
    email: string;
    repeatPassword: string;
    enterUserOrEmail: string;
    enterPassword: string;
    enterEmail: string;
    daylight: string;
    darklight: string;
  };
  
  // Projects
  projects: {
    title: string;
    newProject: string;
    project: string;
    dop: string;
    warehouse: string;
    production: string;
    status: string;
    conditions: string;
    country: string;
    region: string;
    active: string;
    closed: string;
    weekly: string;
    monthly: string;
    advertising: string;
    noRegion: string;
    saveChanges: string;
  };
  
  // Settings
  settings: {
    title: string;
    preferences: string;
    theme: string;
    dark: string;
    light: string;
    saved: string;
  };
  
  // User Menu
  userMenu: {
    profile: string;
    settings: string;
    changePassword: string;
    keyboardShortcuts: string;
    helpCenter: string;
    logout: string;
  };
  
  // Mensajes comunes
  messages: {
    error: string;
    success: string;
    loading: string;
    confirmDelete: string;
  };
  
  // Navegación
  navigation: {
    projects: string;
    payroll: string;
    planning: string;
    reports: string;
    team: string;
    needs: string;
    conditions: string;
  };
}

const translations: Record<Language, Translations> = {
  'Español': {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Borrar',
    edit: 'Editar',
    create: 'Crear',
    back: 'Volver',
    next: 'Siguiente',
    close: 'Cerrar',
    yes: 'Sí',
    no: 'No',
    auth: {
      user: 'Usuario',
      password: 'Contraseña',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      back: '← Volver',
      noAccount: '¿No tienes cuenta?',
      signUp: 'Regístrate',
      name: 'Nombre',
      lastName: 'Apellido',
      role: 'Rol',
      language: 'Idioma',
      email: 'Email',
      repeatPassword: 'Repite contraseña',
      enterUserOrEmail: 'Introduce tu usuario o email',
      enterPassword: 'Introduce tu contraseña',
      enterEmail: 'tucorreo@ejemplo.com',
      daylight: 'Daylight',
      darklight: 'Darklight',
    },
    projects: {
      title: 'Proyectos',
      newProject: 'Nuevo proyecto',
      project: 'Proyecto',
      dop: 'DoP',
      warehouse: 'Almacén',
      production: 'Productora',
      status: 'Estado',
      conditions: 'Condiciones',
      country: 'País',
      region: 'Región',
      active: 'Activo',
      closed: 'Cerrado',
      weekly: 'Semanal',
      monthly: 'Mensual',
      advertising: 'Publicidad',
      noRegion: 'Sin región específica',
      saveChanges: 'Guardar cambios',
    },
    settings: {
      title: 'Configuración',
      preferences: 'Preferencias',
      theme: 'Tema',
      dark: 'Oscuro',
      light: 'Claro',
      saved: 'Configuración guardada ✓',
    },
    userMenu: {
      profile: 'Perfil',
      settings: 'Configuración',
      changePassword: 'Cambiar contraseña',
      keyboardShortcuts: 'Atajos de teclado',
      helpCenter: 'Centro de ayuda / Feedback',
      logout: 'Salir',
    },
    messages: {
      error: 'Error',
      success: 'Éxito',
      loading: 'Cargando...',
      confirmDelete: '¿Estás seguro de eliminar?',
    },
    navigation: {
      projects: 'Proyectos',
      payroll: 'Nómina',
      planning: 'Planificación',
      reports: 'Reportes',
      team: 'Equipo',
      needs: 'Necesidades',
      conditions: 'Condiciones',
    },
  },
  'Catalán': {
    save: 'Guardar',
    cancel: 'Cancel·lar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    back: 'Tornar',
    next: 'Següent',
    close: 'Tancar',
    yes: 'Sí',
    no: 'No',
    auth: {
      user: 'Usuari',
      password: 'Contrasenya',
      login: 'Iniciar sessió',
      register: 'Registrar-se',
      back: '← Tornar',
      noAccount: 'No tens compte?',
      signUp: 'Registra\'t',
      name: 'Nom',
      lastName: 'Cognom',
      role: 'Rol',
      language: 'Idioma',
      email: 'Correu electrònic',
      repeatPassword: 'Repeteix contrasenya',
      enterUserOrEmail: 'Introdueix el teu usuari o correu',
      enterPassword: 'Introdueix la teva contrasenya',
      enterEmail: 'elteucorreu@exemple.com',
      daylight: 'Daylight',
      darklight: 'Darklight',
    },
    projects: {
      title: 'Projectes',
      newProject: 'Nou projecte',
      project: 'Projecte',
      dop: 'DoP',
      warehouse: 'Magatzem',
      production: 'Productora',
      status: 'Estat',
      conditions: 'Condicions',
      country: 'País',
      region: 'Regió',
      active: 'Actiu',
      closed: 'Tancat',
      weekly: 'Setmanal',
      monthly: 'Mensual',
      advertising: 'Publicitat',
      noRegion: 'Sense regió específica',
      saveChanges: 'Guardar canvis',
    },
    settings: {
      title: 'Configuració',
      preferences: 'Preferències',
      theme: 'Tema',
      dark: 'Fosc',
      light: 'Clar',
      saved: 'Configuració guardada ✓',
    },
    userMenu: {
      profile: 'Perfil',
      settings: 'Configuració',
      changePassword: 'Canviar contrasenya',
      keyboardShortcuts: 'Dreceres de teclat',
      helpCenter: 'Centre d\'ajuda / Feedback',
      logout: 'Sortir',
    },
    messages: {
      error: 'Error',
      success: 'Èxit',
      loading: 'Carregant...',
      confirmDelete: 'Estàs segur d\'eliminar?',
    },
    navigation: {
      projects: 'Projectes',
      payroll: 'Nòmina',
      planning: 'Planificació',
      reports: 'Informes',
      team: 'Equip',
      needs: 'Necessitats',
      conditions: 'Condicions',
    },
  },
  'Inglés': {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    back: 'Back',
    next: 'Next',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    auth: {
      user: 'User',
      password: 'Password',
      login: 'Sign in',
      register: 'Sign up',
      back: '← Back',
      noAccount: 'Don\'t have an account?',
      signUp: 'Sign up',
      name: 'First name',
      lastName: 'Last name',
      role: 'Role',
      language: 'Language',
      email: 'Email',
      repeatPassword: 'Repeat password',
      enterUserOrEmail: 'Enter your username or email',
      enterPassword: 'Enter your password',
      enterEmail: 'your.email@example.com',
      daylight: 'Daylight',
      darklight: 'Darklight',
    },
    projects: {
      title: 'Projects',
      newProject: 'New project',
      project: 'Project',
      dop: 'DoP',
      warehouse: 'Warehouse',
      production: 'Production company',
      status: 'Status',
      conditions: 'Conditions',
      country: 'Country',
      region: 'Region',
      active: 'Active',
      closed: 'Closed',
      weekly: 'Weekly',
      monthly: 'Monthly',
      advertising: 'Advertising',
      noRegion: 'No specific region',
      saveChanges: 'Save changes',
    },
    settings: {
      title: 'Settings',
      preferences: 'Preferences',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      saved: 'Settings saved ✓',
    },
    userMenu: {
      profile: 'Profile',
      settings: 'Settings',
      changePassword: 'Change password',
      keyboardShortcuts: 'Keyboard shortcuts',
      helpCenter: 'Help center / Feedback',
      logout: 'Logout',
    },
    messages: {
      error: 'Error',
      success: 'Success',
      loading: 'Loading...',
      confirmDelete: 'Are you sure you want to delete?',
    },
    navigation: {
      projects: 'Projects',
      payroll: 'Payroll',
      planning: 'Planning',
      reports: 'Reports',
      team: 'Team',
      needs: 'Needs',
      conditions: 'Conditions',
    },
  },
};

export default translations;



