import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Replace the default "грн" text with the symbol "₴"
  return formatted.replace("грн", "₴");
}

export function formatPlate(plate: string): string {
  return plate.toUpperCase().replace(/\s/g, "");
}

export function toTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatCompanyName(name: string): string {
  if (!name) return "";
  
  // Прибираємо всі види лапок (прямі, кутові, типографські «„""''‚`») та коми.
  let formatted = name.replace(/["«»„“”‘’‚'`,]/g, ' ');
  
  // Юридичні форми та «шум» — прибираємо, щоб показувати бренд. Довші фрази ПЕРЕД
  // коротшими (порядок важливий для коректного видалення).
  const stopwords = [
    "ПРИВАТНЕ АКЦІОНЕРНЕ ТОВАРИСТВО", "ПУБЛІЧНЕ АКЦІОНЕРНЕ ТОВАРИСТВО", "АКЦІОНЕРНЕ ТОВАРИСТВО",
    "НАЦІОНАЛЬНА АКЦІОНЕРНА СТРАХОВА КОМПАНІЯ", "ТОВАРИСТВО З ДОДАТКОВОЮ ВІДПОВІДАЛЬНІСТЮ",
    "СТРАХОВА КОМПАНІЯ", "СТРАХОВЕ ТОВАРИСТВО", "СТРАХОВА ГРУПА", "ВІЄННА ІНШУРАНС ГРУП",
    "ПРАТ", "ПАТ", "АТ", "ТДВ", "СК", "НАСК", "СГ", "УСК", "ТОВ", "ДП"
  ];
  
  stopwords.forEach(word => {
    const regex = new RegExp(`(^|\\s)${word}(?=\\s|$)`, 'gi');
    formatted = formatted.replace(regex, ' ');
    formatted = formatted.replace(regex, ' '); // run twice for consecutive words
  });

  // Видаляємо всі слова, які містять латинські літери (наприклад, дублювання латиницею)
  let noEnglish = formatted.replace(/[a-zA-Z]+/g, ' ');
  
  // Видаляємо дужки, які могли залишитись порожніми після видалення тексту, наприклад: "()" або "( )"
  noEnglish = noEnglish.replace(/\(\s*\)/g, ' ');
  
  // Прибираємо зайві пробіли
  noEnglish = noEnglish.replace(/\s+/g, ' ').trim();

  // Якщо назва компанії складалась ТІЛЬКИ з латиниці (наприклад, "ARX"), 
  // повертаємо відформатований варіант з латиницею, щоб не повертати порожній рядок.
  if (!noEnglish) {
    return formatted.replace(/\s+/g, ' ').trim();
  }

  return noEnglish;
}
