/**
 * Hero illustration: a stylised diagram-builder canvas.
 * This IS the product — typed blocks connected by typed relations, with a live
 * rule-check badge — rendered as a self-contained SVG so the hero shows what
 * Flowgram does without shipping an external screenshot.
 */

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
  color: string;
}

const W = 150;
const H = 52;

const nodes: Node[] = [
  { id: 'user', x: 34, y: 44, label: 'Người dùng', type: 'Thực thể', color: '#22d3ee' },
  { id: 'order', x: 452, y: 34, label: 'Đơn hàng', type: 'Thực thể', color: '#818cf8' },
  { id: 'pay', x: 250, y: 168, label: 'Thanh toán', type: 'Tiến trình', color: '#a855f7' },
  { id: 'stock', x: 44, y: 300, label: 'Kho hàng', type: 'Thực thể', color: '#3b82f6' },
  { id: 'ship', x: 452, y: 288, label: 'Vận chuyển', type: 'Tiến trình', color: '#22d3ee' },
];

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

const edges: { from: string; to: string; label: string; flow?: boolean }[] = [
  { from: 'user', to: 'order', label: 'tạo', flow: true },
  { from: 'order', to: 'pay', label: 'gồm', flow: true },
  { from: 'stock', to: 'order', label: 'cấp' },
  { from: 'pay', to: 'ship', label: 'kích hoạt', flow: true },
  { from: 'user', to: 'pay', label: 'sở hữu' },
];

function anchor(n: Node) {
  return { cx: n.x + W / 2, cy: n.y + H / 2 };
}

export function DiagramMock() {
  return (
    <svg viewBox="0 0 640 400" className="w-full h-auto" role="img" aria-label="Bản đồ quan hệ sơ đồ mẫu">
      <defs>
        <linearGradient id="nl-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* edges */}
      {edges.map((e) => {
        const from = byId[e.from];
        const to = byId[e.to];
        if (!from || !to) return null;
        const a = anchor(from);
        const b = anchor(to);
        const mx = (a.cx + b.cx) / 2;
        const my = (a.cy + b.cy) / 2;
        return (
          <g key={`${e.from}-${e.to}`}>
            <line
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke="url(#nl-edge)"
              strokeWidth={1.6}
              strokeOpacity={0.55}
              className={e.flow ? 'nl-edge-flow' : undefined}
            />
            <g transform={`translate(${mx}, ${my})`}>
              <rect x={-e.label.length * 3.6 - 6} y={-9} width={e.label.length * 7.2 + 12} height={18} rx={9} fill="#0c0d17" stroke="rgba(148,163,184,0.25)" />
              <text textAnchor="middle" dy="3.5" fontSize="10" fill="#9aa1b9" fontFamily="Inter, sans-serif">
                {e.label}
              </text>
            </g>
          </g>
        );
      })}

      {/* nodes */}
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
          <rect
            width={W}
            height={H}
            rx={12}
            fill="#12131f"
            stroke="rgba(148,163,184,0.22)"
          />
          <rect width={4} height={H} rx={2} fill={n.color} />
          <circle cx={22} cy={H / 2} r={7} fill="none" stroke={n.color} strokeWidth={2} />
          <text x={40} y={22} fontSize="13" fontWeight="600" fill="#e6e8f2" fontFamily="Inter, sans-serif">
            {n.label}
          </text>
          <text x={40} y={38} fontSize="10" fill="#6b7192" fontFamily="Inter, sans-serif">
            {n.type}
          </text>
        </g>
      ))}

      {/* rule-check badge */}
      <g transform="translate(300, 336)">
        <rect x={-72} y={-14} width={168} height={28} rx={14} fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.4)" />
        <circle cx={-56} cy={0} r={4} fill="#22d3ee" />
        <text x={-44} y={4} fontSize="11" fill="#c7f5ff" fontFamily="Inter, sans-serif">
          Luật hợp lệ · 12/12 ràng buộc
        </text>
      </g>
    </svg>
  );
}
