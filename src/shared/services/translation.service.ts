/**
 * Servicio de traducción usando DeepL API
 * Requiere VITE_DEEPL_API_KEY en variables de entorno
 */

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// Mapeo de códigos de idioma de i18n a códigos de DeepL
const LANGUAGE_MAP: Record<string, string> = {
  es: 'ES',
  en: 'EN',
  ca: 'ES', // DeepL no tiene catalán, usar español como fallback
};

interface TranslationResponse {
  translations: Array<{
    text: string;
    detected_source_language?: string;
  }>;
}

/**
 * Traduce un texto al idioma objetivo usando DeepL API
 * @param text Texto a traducir
 * @param targetLanguage Idioma objetivo (es, en, ca)
 * @returns Texto traducido o el texto original si falla
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  const apiKey = (import.meta as any)?.env?.VITE_DEEPL_API_KEY as string | undefined;
  
  if (!apiKey) {
    const errorMessage = 'DeepL API key missing (VITE_DEEPL_API_KEY). Translation disabled. Para habilitar la traducción, crea un archivo .env con: VITE_DEEPL_API_KEY=tu_api_key';
    console.warn(errorMessage);
    throw new Error(errorMessage);
  }

  const targetLang = LANGUAGE_MAP[targetLanguage] || 'ES';
  
  // Para catalán, intentamos traducir a español ya que DeepL no lo soporta directamente
  // El usuario puede ajustar manualmente si es necesario
  const finalTargetLang = targetLanguage === 'ca' ? 'ES' : targetLang;

  try {
    const formData = new URLSearchParams();
    formData.append('auth_key', apiKey);
    formData.append('text', text);
    formData.append('target_lang', finalTargetLang);
    // No especificamos source_lang para que DeepL lo detecte automáticamente

    console.log('🌐 Traduciendo a:', finalTargetLang, 'Texto:', text.substring(0, 100) + '...');

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepL API error:', response.status, errorText);
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as TranslationResponse;
    
    if (data.translations && data.translations.length > 0) {
      const translated = data.translations[0].text;
      console.log('✅ Traducción exitosa:', translated.substring(0, 100) + '...');
      return translated;
    }

    console.warn('⚠️ No se recibió traducción de DeepL');
    return text;
  } catch (error) {
    console.error('❌ Error translating text:', error);
    throw error; // Re-lanzar el error para que se maneje en el componente
  }
}

/**
 * Traduce un texto preservando las variables {{VAR}}
 * @param text Texto con posibles variables
 * @param targetLanguage Idioma objetivo
 * @returns Texto traducido con variables preservadas
 */
export async function translateTextWithVariables(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (!text || text.trim() === '') return text;

  // Extraer variables del texto
  const variablePattern = /\{\{[^}]+\}\}/g;
  const variables: Array<{ placeholder: string; value: string }> = [];
  let placeholderIndex = 0;
  
  // Reemplazar variables con placeholders temporales
  let textWithPlaceholders = text.replace(variablePattern, (match) => {
    const placeholder = `__VAR_${placeholderIndex}__`;
    variables.push({ placeholder, value: match });
    placeholderIndex++;
    return placeholder;
  });

  // Traducir el texto con placeholders
  const translated = await translateText(textWithPlaceholders, targetLanguage);

  // Restaurar las variables originales
  let result = translated;
  variables.forEach(({ placeholder, value }) => {
    result = result.replace(placeholder, value);
  });

  return result;
}

