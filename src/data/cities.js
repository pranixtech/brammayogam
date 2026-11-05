const CITY_DATA = {
  IN: [
    'Mumbai', 'Delhi', 'New Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur',
    'Surat', 'Kochi', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Thanjavur',
    'Thoothukudi', 'Puducherry', 'Visakhapatnam', 'Vijayawada', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Mysuru',
    'Mangaluru', 'Hubballi', 'Belagavi', 'Nashik', 'Nagpur', 'Indore', 'Bhopal', 'Vadodara', 'Rajkot', 'Udaipur',
    'Jodhpur', 'Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati', 'Chandigarh',
    'Amritsar', 'Ludhiana', 'Dehradun', 'Shimla', 'Jammu', 'Srinagar', 'Raipur', 'Panaji', 'Agra', 'Noida', 'Gurugram',
  ],
  MY: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Malacca', 'Klang', 'Shah Alam', 'Kuching', 'Kota Kinabalu'],
  LK: ['Colombo', 'Kandy', 'Jaffna', 'Galle', 'Trincomalee', 'Batticaloa'],
  SG: ['Singapore'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Seattle', 'Boston', 'Dallas', 'Austin', 'Washington'],
  GB: ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
  NZ: ['Auckland', 'Wellington', 'Christchurch'],
  FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
  DE: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  RU: ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk'],
  JP: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
  CN: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
  HK: ['Hong Kong'],
  ID: ['Jakarta', 'Surabaya', 'Bandung', 'Bali'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
  VN: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
  PH: ['Manila', 'Cebu City', 'Davao City'],
  SA: ['Riyadh', 'Jeddah', 'Mecca', 'Medina'],
  QA: ['Doha'],
  OM: ['Muscat'],
  BH: ['Manama'],
  KW: ['Kuwait City'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
  KE: ['Nairobi', 'Mombasa'],
  NG: ['Lagos', 'Abuja'],
  BD: ['Dhaka', 'Chittagong', 'Sylhet'],
  PK: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'],
  NP: ['Kathmandu', 'Pokhara'],
}

export const CITY_OPTIONS = Object.entries(CITY_DATA).flatMap(([countryCode, cities]) => (
  cities.map((name) => ({ name, countryCode }))
))

function normalizeCity(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function findCityOption(value) {
  const normalizedValue = normalizeCity(value)
  if (!normalizedValue) return null
  return CITY_OPTIONS.find(({ name }) => normalizeCity(name) === normalizedValue) ?? null
}
