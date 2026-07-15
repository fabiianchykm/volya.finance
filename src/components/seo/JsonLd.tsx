// Інжектить структуровані дані (schema.org) як <script type="application/ld+json">.
// Серверний компонент — рендериться в HTML, Google читає при індексації.
// data може бути одним об'єктом або масивом (кілька блоків розмітки).
//
// ВАЖЛИВО: кожному <script> даємо унікальний id (за @type). React 19 піднімає й
// дедуплікує скрипти; без стабільного id інлайн-JSON-LD, відрендерений усередині
// клієнтського піддерева (сторінка як children SessionProvider), може «загубитись».

export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => {
        const type = (block as { "@type"?: string })["@type"] ?? "data";
        return (
          <script
            key={`${type}-${i}`}
            id={`ld-${String(type).toLowerCase()}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        );
      })}
    </>
  );
}
