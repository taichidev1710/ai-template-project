const LOGOS = ['Northwind', 'Acme Corp', 'Lumen', 'Vertex', 'Quanta', 'Hyperflow', 'Basecraft', 'Orbital'];

/** "Trusted by" auto-scrolling wordmark strip (placeholder brands). */
export function Logos() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section className="py-10">
      <div className="nl-container">
        <p className="nl-faint text-center text-sm">Được các đội ngũ thiết kế hệ thống tin dùng</p>
        <div className="nl-marquee mt-6">
          <div className="nl-marquee-track">
            {row.map((name, i) => (
              <span key={`${name}-${i}`} className="nl-muted text-lg font-semibold tracking-tight opacity-70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
