import { useState, useEffect } from 'react';
import './CountrySelector.css';

interface Country {
  name: {
    common: string;
  };
  cca2: string;
  flag: string;
}

interface City {
  name: string;
  country: string;
}

interface CountrySelectorProps {
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
}

export default function CountrySelector({ onCountryChange, onCityChange }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Cargar países al montar el componente
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
        const data = await response.json();
        const sortedCountries = data.sort((a: Country, b: Country) => 
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sortedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Cargar ciudades cuando se selecciona un país
  useEffect(() => {
    if (selectedCountry) {
      const fetchCities = async () => {
        setLoadingCities(true);
        try {
          // Primero intentar obtener la capital del país desde REST Countries
          const restCountriesResponse = await fetch(
            `https://restcountries.com/v3.1/alpha/${selectedCountry}`
          );
          
          let capitalCity = null;
          if (restCountriesResponse.ok) {
            const countryData = await restCountriesResponse.json();
            capitalCity = countryData[0]?.capital?.[0];
          }

          // Usar nuestro sistema de fallback robusto que incluye la capital
          const fallbackCities = getFallbackCities(selectedCountry, capitalCity);
          setCities(fallbackCities);
        } catch (error) {
          console.error('Error fetching cities:', error);
          // Usar ciudades de fallback sin capital
          setCities(getFallbackCities(selectedCountry));
        } finally {
          setLoadingCities(false);
        }
      };

      fetchCities();
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedCountry]);

  const getFallbackCities = (countryCode: string, capitalCity?: string): City[] => {
    const fallbackCities: { [key: string]: string[] } = {
      'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Miami', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa', 'New Orleans'],
      'MX': ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí', 'Mérida', 'Mexicali', 'Aguascalientes', 'Cuernavaca', 'Saltillo', 'Hermosillo', 'Culiacán', 'Durango', 'Toluca', 'Tuxtla Gutiérrez', 'Reynosa', 'Chimalhuacán', 'Tlalnepantla', 'Morelia', 'Veracruz', 'Villahermosa', 'Irapuato', 'Gómez Palacio', 'Xalapa', 'Chihuahua', 'Mazatlán', 'Nuevo Laredo', 'Acapulco', 'Tlaquepaque', 'Cancún', 'Pachuca', 'Oaxaca'],
      'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke', 'St. Johns', 'Barrie', 'Kelowna', 'Abbotsford', 'Greater Sudbury', 'Kingston', 'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Whitby', 'Coquitlam', 'Saanich', 'Burlington', 'Richmond', 'Oakville', 'Burnaby', 'Red Deer', 'Brantford', 'Lethbridge', 'Kamloops', 'Nanaimo'],
      'ES': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet', 'Vitoria', 'A Coruña', 'Elche', 'Granada', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez', 'Sabadell', 'Móstoles', 'Santa Cruz', 'Pamplona', 'Almería', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Donostia', 'Burgos', 'Santander', 'Castellón', 'Alcorcón', 'Albacete', 'Getafe'],
      'CO': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales', 'Neiva', 'Soledad', 'Villavicencio', 'Bello', 'Valledupar', 'Montería', 'Itagüí', 'Palmira', 'Buenaventura', 'Floridablanca', 'Sincelejo', 'Popayán', 'Barrancabermeja', 'Dos Quebradas', 'Tulúa', 'Envigado', 'Cartago', 'Girardot', 'Buga', 'Tunja', 'Florencia', 'Malambo', 'Sogamoso', 'Facatativá', 'Riohacha', 'Duitama', 'Fusagasugá', 'Zipaquirá'],
      'CU': ['La Habana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Guantánamo', 'Santa Clara', 'Las Tunas', 'Bayamo', 'Cienfuegos', 'Pinar del Río', 'Matanzas', 'Ciego de Ávila', 'Sancti Spíritus', 'Manzanillo', 'Cardenas', 'Palma Soriano', 'Contramaestre', 'Morón', 'Florida', 'Placetas', 'Trinidad', 'Nueva Gerona', 'Artemisa', 'San José de las Lajas', 'Güines'],
      'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Santiago del Estero', 'Corrientes', 'Posadas', 'Neuquén', 'Bahía Blanca', 'Paraná', 'Formosa', 'San Luis', 'La Rioja', 'Catamarca', 'Río Cuarto', 'Comodoro Rivadavia', 'Concordia', 'San Nicolás', 'San Rafael', 'Tandil', 'Venado Tuerto', 'Junín', 'Olavarría', 'Azul', 'Pergamino', 'San Carlos de Bariloche', 'Zárate', 'Campana', 'Río Gallegos', 'Ushuaia', 'Puerto Madryn', 'Trelew', 'Rawson'],
      'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Nova Iguaçu', 'Teresina', 'Natal', 'Osasco', 'Campo Grande', 'Santo André', 'João Pessoa', 'Jaboatão dos Guararapes', 'Contagem', 'São Bernardo do Campo', 'Uberlândia', 'Sorocaba', 'Aracaju', 'Feira de Santana', 'Cuiabá', 'Joinville', 'Aparecida de Goiânia', 'Londrina', 'Ananindeua', 'Porto Velho', 'Serra', 'Niterói'],
      'PE': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Huancayo', 'Tacna', 'Juliaca', 'Ica', 'Sullana', 'Ayacucho', 'Chincha Alta', 'Huánuco', 'Tarapoto', 'Pucallpa', 'Cajamarca', 'Puno', 'Tumbes', 'Talara', 'Huaraz', 'Jaén', 'Ilo', 'Moquegua', 'Abancay', 'Cerro de Pasco', 'Tingo María', 'Huacho'],
      'CL': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán', 'Iquique', 'Los Ángeles', 'Puerto Montt', 'Calama', 'Coquimbo', 'Osorno', 'Valdivia', 'Punta Arenas', 'Copiapó', 'Quillota', 'Curicó', 'Ovalle', 'Linares', 'San Antonio', 'Melipilla', 'Angol', 'Coyhaique', 'Castro', 'Ancud', 'Villarrica'],
      'EC': ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato', 'Esmeraldas', 'Quevedo', 'Riobamba', 'Milagro', 'Ibarra', 'La Libertad', 'Babahoyo', 'Sangolquí', 'Daule', 'Velasco Ibarra', 'Pasaje', 'Chone', 'Santa Elena', 'El Carmen', 'Salinas', 'Azogues', 'Guaranda', 'Latacunga', 'Macas', 'Puyo'],
      'VE': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'San Cristóbal', 'Maturín', 'Ciudad Bolívar', 'Cumana', 'Mérida', 'Barcelona', 'Turmero', 'Cabimas', 'Santa Teresa del Tuy', 'Barinas', 'Trujillo', 'Puerto La Cruz', 'Los Teques', 'Acarigua', 'Carúpano', 'Coro', 'Punto Fijo', 'Los Guayos', 'Guacara', 'Valera', 'Catia La Mar', 'El Tigre', 'Porlamar', 'Araure'],
      'UY': ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes', 'Artigas', 'Minas', 'San José de Mayo', 'Durazno', 'Florida', 'Barros Blancos', 'Ciudad de la Costa', 'San Carlos', 'Fray Bentos', 'Rocha', 'Trinidad', 'La Paz', 'Canelones', 'Young', 'Dolores', 'Río Branco', 'Nueva Helvecia', 'Carmelo', 'Colonia del Sacramento', 'Pando', 'Treinta y Tres'],
      'PY': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Ñemby', 'Encarnación', 'Mariano Roque Alonso', 'Pedro Juan Caballero', 'Coronel Oviedo', 'Concepción', 'Villa Elisa', 'Villarrica', 'Caaguazú', 'Itauguá', 'Caacupé', 'Paraguarí', 'Pilar', 'Villa Hayes', 'Hernandarias', 'Presidente Franco', 'Caazapá', 'San Antonio', 'Ypacaraí', 'Santaní', 'Itá', 'San Pedro'],
      'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Limoges', 'Tours', 'Amiens', 'Perpignan', 'Metz'],
      'IT': ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Taranto', 'Brescia', 'Parma', 'Prato', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara'],
      'DE': ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen'],
      'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leeds', 'Cardiff', 'Belfast', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth', 'Southampton', 'Reading', 'Derby', 'Portsmouth', 'Preston', 'Aberdeen', 'Northampton', 'Norwich', 'Luton', 'Swindon', 'Dundee'],
      'JP': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Sagamihara', 'Shizuoka', 'Kumamoto', 'Kagoshima', 'Matsuyama', 'Kanazawa', 'Utsunomiya', 'Matsudo', 'Kawaguchi', 'Ichikawa', 'Fukuyama', 'Iwaki'],
      'CN': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Chongqing', 'Shenyang', 'Hangzhou', 'Xian', 'Harbin', 'Suzhou', 'Qingdao', 'Dalian', 'Zhengzhou', 'Shantou', 'Jinan', 'Changchun', 'Kunming', 'Changsha', 'Taiyuan', 'Xiamen', 'Hefei', 'Shijiazhuang', 'Urumqi', 'Fuzhou', 'Wuxi'],
      'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi'],
      'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston', 'Mackay', 'Rockhampton', 'Bunbury', 'Bundaberg', 'Coffs Harbour', 'Wagga Wagga', 'Hervey Bay', 'Mildura', 'Shepparton', 'Port Macquarie'],
      'DO': ['Santo Domingo', 'Santiago', 'San Pedro de Macorís', 'La Romana', 'San Francisco de Macorís', 'Puerto Plata', 'San Cristóbal', 'Higüey', 'Concepción de La Vega', 'Azua', 'Baní', 'Moca', 'Bonao', 'San Juan', 'Barahona', 'Cotuí', 'Nagua', 'Monte Cristi', 'Hato Alcántara', 'Esperanza'],
      'PA': ['Ciudad de Panamá', 'San Miguelito', 'Tocumen', 'David', 'Arraiján', 'Colón', 'Las Cumbres', 'Pacora', 'Chitré', 'Santiago', 'Vista Alegre', 'La Chorrera', 'Pedregal', 'Chepo', 'Chilibre', 'Aguadulce', 'Penonomé', 'Las Tablas', 'Capira', 'Bugaba'],
      'CR': ['San José', 'Cartago', 'Puntarenas', 'Alajuela', 'Heredia', 'Limón', 'Desamparados', 'San Francisco', 'Goicoechea', 'Guadalupe', 'La Unión', 'Curridabat', 'San Isidro', 'Colón', 'Aserrí', 'Puriscal', 'Grecia', 'Santa Ana', 'Orotina', 'Atenas'],
      'GT': ['Ciudad de Guatemala', 'Mixco', 'Villa Nueva', 'Petapa', 'San Juan Sacatepéquez', 'Quetzaltenango', 'Villa Canales', 'Escuintla', 'Chinautla', 'Chimaltenango', 'Huehuetenango', 'Amatitlán', 'Totonicapán', 'Santa Catarina Pinula', 'Santa Lucía Cotzumalguapa', 'Puerto Barrios', 'San Francisco El Alto', 'Cobán', 'San Pedro Ayampuc', 'Jalapa'],
      'HN': ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso', 'Choluteca', 'Comayagua', 'Puerto Cortés', 'La Lima', 'Danlí', 'Siguatepeque', 'Juticalpa', 'Catacamas', 'Tocoa', 'Tela', 'Santa Rosa de Copán', 'Olanchito', 'Potrerillos', 'Santa Bárbara', 'Villanueva'],
      'NI': ['Managua', 'León', 'Masaya', 'Matagalpa', 'Chinandega', 'Granada', 'Estelí', 'Tipitapa', 'Jinotepe', 'Juigalpa', 'Rivas', 'Nueva Guinea', 'Boaco', 'Ocotal', 'Somoto', 'San Carlos', 'Carazo', 'Chichigalpa', 'Nagarote', 'El Viejo'],
      'SV': ['San Salvador', 'Soyapango', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Santa Tecla', 'Apopa', 'Delgado', 'Ilopango', 'Cojutepeque', 'Ahuachapán', 'Usulután', 'Zacatecoluca', 'Chalchuapa', 'Quezaltepeque', 'Sensuntepeque', 'San Marcos', 'San Rafael Oriente', 'Antiguo Cuscatlán', 'La Unión']
    };

    const cityNames = fallbackCities[countryCode];
    if (!cityNames) {
      // Si no hay ciudades específicas para el país, usar la capital si está disponible
      const genericCities = [
        capitalCity || 'Capital',
        'Ciudad Principal',
        'Segunda Ciudad',
        'Tercera Ciudad'
      ];
      return genericCities.map(name => ({ name, country: countryCode }));
    }
    
    // Si tenemos ciudades específicas, agregar la capital al inicio si no está ya incluida
    let cities = [...cityNames];
    if (capitalCity && !cities.includes(capitalCity)) {
      cities = [capitalCity, ...cities];
    }
    
    return cities.map(name => ({ name, country: countryCode }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedCity('');
    onCountryChange(country);
    onCityChange('');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    onCityChange(city);
  };

  return (
    <div className="country-selector">
      <div className="selector-group">
        <label htmlFor="country">País *</label>
        <select
          id="country"
          value={selectedCountry}
          onChange={handleCountryChange}
          className="form-select"
          disabled={loadingCountries}
        >
          <option value="">
            {loadingCountries ? 'Cargando países...' : 'Selecciona un país'}
          </option>
          {countries.map((country) => (
            <option key={country.cca2} value={country.cca2}>
              {country.flag} {country.name.common}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label htmlFor="city">Ciudad *</label>
        <select
          id="city"
          value={selectedCity}
          onChange={handleCityChange}
          className="form-select"
          disabled={!selectedCountry || loadingCities}
        >
          <option value="">
            {loadingCities 
              ? 'Cargando ciudades...' 
              : selectedCountry 
                ? 'Selecciona una ciudad'
                : 'Primero selecciona un país'
            }
          </option>
          {cities.map((city, index) => (
            <option key={index} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
