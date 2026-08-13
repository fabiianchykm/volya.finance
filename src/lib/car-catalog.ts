// Локальний довідник марок і моделей авто для автопідказки в ручному вводі.
// Ukasko НЕ має API-довідника марок/моделей (передаються вільним текстом), а з
// 01.07.2026 ГСЦ МВС припинив оприлюднення даних за держномером — тож дані часто
// не підтягуються і клієнт вводить вручну. Автопідказка спрощує це, але вільний
// ввід лишається дозволеним (можна вписати будь-що поза списком).

// Найпоширеніші в Україні марки (латиниця — як у полісах Ukasko: mark_name).
export const CAR_MARKS: string[] = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "BYD", "Cadillac", "Chery", "Chevrolet",
  "Chrysler", "Citroen", "Dacia", "Daewoo", "Dodge", "Fiat", "Ford", "Geely",
  "Genesis", "GMC", "Great Wall", "Haval", "Honda", "Hummer", "Hyundai", "Infiniti",
  "Isuzu", "Iveco", "JAC", "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Lifan",
  "Lincoln", "Mazda", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "Nissan", "Opel",
  "Peugeot", "Porsche", "Ravon", "Renault", "Saab", "SEAT", "Skoda", "Smart",
  "SsangYong", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "Zeekr",
  "ВАЗ (Lada)", "ГАЗ", "ЗАЗ", "Богдан", "УАЗ", "Москвич",
];

// Популярні моделі за марками (не вичерпний список — вільний ввід дозволений).
export const CAR_MODELS: Record<string, string[]> = {
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT", "80", "100"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX"],
  "BYD": ["Atto 3", "Dolphin", "Han", "Seal", "Song", "Tang", "Yuan"],
  "Chery": ["Amulet", "Arrizo", "Eastar", "Kimo", "QQ", "Tiggo", "Tiggo 2", "Tiggo 4", "Tiggo 7", "Tiggo 8"],
  "Chevrolet": ["Aveo", "Captiva", "Cruze", "Epica", "Evanda", "Lacetti", "Lanos", "Malibu", "Niva", "Orlando", "Spark", "Tacuma", "Tahoe", "Trailblazer", "Volt"],
  "Citroen": ["Berlingo", "C1", "C3", "C4", "C5", "C-Elysee", "DS3", "DS4", "Jumpy", "Nemo"],
  "Dacia": ["Dokker", "Duster", "Lodgy", "Logan", "Sandero"],
  "Daewoo": ["Lanos", "Matiz", "Nexia", "Nubira", "Sens", "Tacuma"],
  "Fiat": ["500", "Doblo", "Ducato", "Linea", "Panda", "Punto", "Scudo", "Tipo"],
  "Ford": ["C-Max", "Connect", "Edge", "Escape", "Explorer", "Fiesta", "Focus", "Fusion", "Galaxy", "Kuga", "Mondeo", "Mustang", "Ranger", "S-Max", "Transit"],
  "Geely": ["Atlas", "Coolray", "Emgrand", "Emgrand X7", "GC6", "MK", "Tugella"],
  "Great Wall": ["Haval H3", "Haval H5", "Hover", "Safe", "Wingle"],
  "Haval": ["Dargo", "F7", "H2", "H6", "H9", "Jolion"],
  "Honda": ["Accord", "City", "Civic", "CR-V", "CR-Z", "HR-V", "Insight", "Jazz", "Pilot", "Legend"],
  "Hyundai": ["Accent", "Creta", "Elantra", "Getz", "i10", "i20", "i30", "ix35", "Kona", "Santa Fe", "Solaris", "Sonata", "Tucson", "Veloster"],
  "Infiniti": ["EX", "FX", "G", "M", "Q50", "Q70", "QX50", "QX70", "QX80"],
  "Jeep": ["Cherokee", "Compass", "Grand Cherokee", "Renegade", "Wrangler"],
  "Kia": ["Carens", "Carnival", "Ceed", "Cerato", "Magentis", "Niro", "Optima", "Picanto", "Rio", "Sorento", "Soul", "Sportage", "Stinger", "Venga"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT", "ES", "GS", "GX", "IS", "LS", "LX", "NX", "RX", "UX"],
  "Mazda": ["2", "3", "5", "6", "CX-3", "CX-30", "CX-5", "CX-7", "CX-9", "MX-5"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "ML", "Sprinter", "Vito", "Viano"],
  "MG": ["3", "5", "6", "HS", "ZS"],
  "Mini": ["Clubman", "Cooper", "Countryman", "Hatch", "Paceman"],
  "Mitsubishi": ["ASX", "Colt", "Eclipse Cross", "Galant", "Grandis", "L200", "Lancer", "Outlander", "Pajero", "Pajero Sport", "Space Star"],
  "Nissan": ["Almera", "Juke", "Leaf", "Micra", "Murano", "Navara", "Note", "Pathfinder", "Patrol", "Primera", "Qashqai", "Rogue", "Sentra", "Terrano", "Tiida", "X-Trail"],
  "Opel": ["Astra", "Combo", "Corsa", "Crossland", "Grandland", "Insignia", "Meriva", "Mokka", "Vectra", "Vivaro", "Zafira"],
  "Peugeot": ["108", "2008", "206", "207", "208", "3008", "301", "307", "308", "5008", "508", "Boxer", "Expert", "Partner", "Rifter"],
  "Porsche": ["911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  "Renault": ["Captur", "Clio", "Duster", "Fluence", "Kadjar", "Kangoo", "Koleos", "Laguna", "Logan", "Master", "Megane", "Sandero", "Scenic", "Trafic"],
  "SEAT": ["Alhambra", "Altea", "Arona", "Ateca", "Ibiza", "Leon", "Tarraco", "Toledo"],
  "Skoda": ["Citigo", "Enyaq", "Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Roomster", "Scala", "Superb", "Yeti"],
  "SsangYong": ["Actyon", "Korando", "Kyron", "Rexton", "Tivoli"],
  "Subaru": ["BRZ", "Forester", "Impreza", "Legacy", "Outback", "Tribeca", "XV"],
  "Suzuki": ["Baleno", "Grand Vitara", "Jimny", "Liana", "SX4", "Swift", "Vitara"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Toyota": ["Auris", "Avensis", "Aygo", "C-HR", "Camry", "Corolla", "Highlander", "Land Cruiser", "Land Cruiser Prado", "Prius", "RAV4", "Yaris", "Venza", "Verso", "bZ4X"],
  "Volkswagen": ["Amarok", "Arteon", "Beetle", "Bora", "Caddy", "Golf", "ID.3", "ID.4", "Jetta", "Multivan", "Passat", "Polo", "Sharan", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Touran", "Transporter", "Up"],
  "Volvo": ["C30", "S40", "S60", "S80", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC90"],
  "ВАЗ (Lada)": ["2101", "2103", "2104", "2105", "2106", "2107", "2108", "2109", "2110", "2114", "2115", "Granta", "Kalina", "Largus", "Niva", "Priora", "Vesta", "XRAY"],
  "ГАЗ": ["Volga", "Газель", "Соболь"],
  "ЗАЗ": ["1102 Таврія", "Forza", "Lanos", "Sens", "Vida"],
  "УАЗ": ["Patriot", "Hunter", "469", "452"],
};

const norm = (s: string) => s.trim().toLowerCase();

// Марки, що містять введений підрядок (порожній запит → уся абетка).
export function searchMarks(query: string, limit = 8): string[] {
  const q = norm(query);
  const list = q ? CAR_MARKS.filter((m) => norm(m).includes(q)) : CAR_MARKS;
  return list.slice(0, limit);
}

// Моделі обраної марки, що містять підрядок. Якщо марки нема в довіднику —
// повертаємо порожньо (лишається вільний ввід).
export function searchModels(mark: string, query: string, limit = 10): string[] {
  const key = CAR_MARKS.find((m) => norm(m) === norm(mark));
  const models = (key && CAR_MODELS[key]) || [];
  const q = norm(query);
  const list = q ? models.filter((m) => norm(m).includes(q)) : models;
  return list.slice(0, limit);
}
