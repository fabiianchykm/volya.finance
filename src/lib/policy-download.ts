// Договір кожного продукту забирається своїм ендпоінтом (contract/take у Ukasko
// різний). ОСЦПВ-ендпоінт для Зеленої карти/туризму/… договору не знаходить.
const DOWNLOAD_ENDPOINTS: Record<string, string> = {
  greencard: "/api/greencard/order",
  tourism: "/api/tourism/order",
  housing: "/api/home/order",
  home: "/api/home/order",
  pets: "/api/pets/order",
  "mini-kasko": "/api/mini-kasko/order",
  // Чекаути житла/міні-КАСКО зберігають поліс з українською назвою продукту.
  "Житло": "/api/home/order",
  "Міні-КАСКО": "/api/mini-kasko/order",
};

export function downloadEndpointFor(product?: string | null): string {
  return (product && DOWNLOAD_ENDPOINTS[product]) || "/api/insurance/contract";
}
