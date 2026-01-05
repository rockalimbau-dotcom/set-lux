export interface Country {
  code: string;
  name: string;
}

export interface Region {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'ES', name: 'España' },
  { code: 'FR', name: 'Francia' },
  { code: 'IT', name: 'Italia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
];

export const REGIONS: Record<string, Region[]> = {
  ES: [
    { code: 'AN', name: 'Andalucía' },
    { code: 'AR', name: 'Aragón' },
    { code: 'AS', name: 'Asturias' },
    { code: 'CN', name: 'Canarias' },
    { code: 'CB', name: 'Cantabria' },
    { code: 'CM', name: 'Castilla-La Mancha' },
    { code: 'CL', name: 'Castilla y León' },
    { code: 'CT', name: 'Cataluña' },
    { code: 'EX', name: 'Extremadura' },
    { code: 'GA', name: 'Galicia' },
    { code: 'IB', name: 'Islas Baleares' },
    { code: 'RI', name: 'La Rioja' },
    { code: 'MD', name: 'Madrid' },
    { code: 'MC', name: 'Región de Murcia' },
    { code: 'NC', name: 'Navarra' },
    { code: 'PV', name: 'País Vasco' },
    { code: 'VC', name: 'Comunidad Valenciana' },
    { code: 'CE', name: 'Ceuta' },
    { code: 'ML', name: 'Melilla' },
  ],
  FR: [
    { code: 'IDF', name: 'Île-de-France' },
    { code: 'PACA', name: 'Provence-Alpes-Côte d\'Azur' },
  ],
  US: [
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'Nueva York' },
    { code: 'TX', name: 'Texas' },
  ],
};

