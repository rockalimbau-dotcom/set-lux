import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { storage } from '@shared/services/localStorage.service';

// Importar traducciones
import es from '../locales/es.json';
import en from '../locales/en.json';
import ca from '../locales/ca.json';

// Mapeo de nombres de idioma a códigos
const languageMap: Record<string, string> = {
  'Español': 'es',
  'Catalán': 'ca',
  'Inglés': 'en',
  'Spanish': 'es',
  'Catalan': 'ca',
  'English': 'en',
};

// Función para obtener el idioma desde el perfil del usuario
function getLanguageFromProfile(): string {
  try {
    const profile = storage.getJSON<any>('profile_v1') || {};
    const idioma = profile.idioma;
    if (idioma && languageMap[idioma]) {
      return languageMap[idioma];
    }
  } catch (error) {
    console.error('Error reading language from profile:', error);
  }
  return 'es'; // Por defecto español
}

i18n
  .use(LanguageDetector) // Detecta el idioma del navegador
  .use(initReactI18next) // Pasa i18n a react-i18next
  .init({
    resources: {
      es: {
        translation: es,
      },
      en: {
        translation: en,
      },
      ca: {
        translation: ca,
      },
    },
    lng: getLanguageFromProfile(), // Idioma inicial desde el perfil
    fallbackLng: 'es', // Idioma por defecto si no se encuentra la traducción
    interpolation: {
      escapeValue: false, // React ya escapa los valores
    },
    detection: {
      // Orden de detección: primero el perfil del usuario, luego el navegador
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

// Función helper para cambiar el idioma y guardarlo en el perfil
export function changeLanguage(languageName: string) {
  const languageCode = languageMap[languageName] || 'es';
  i18n.changeLanguage(languageCode);
  
  // Guardar en el perfil para persistencia
  try {
    const profile = storage.getJSON<any>('profile_v1') || {};
    storage.setJSON('profile_v1', { ...profile, idioma: languageName });
  } catch (error) {
    console.error('Error saving language to profile:', error);
  }
}

export default i18n;

