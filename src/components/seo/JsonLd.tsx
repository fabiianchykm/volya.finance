// Інжектить структуровані дані (schema.org) як <script type="application/ld+json">.
// Серверний компонент — рендериться в HTML, Google читає при індексації.
// data може бути одним об'єктом або масивом (кілька блоків розмітки).

export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
