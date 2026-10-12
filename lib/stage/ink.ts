// Hand-drawn geometry: the slightly wobbly red line and the pen-drawn arrows.

const f = (n: number) => n.toFixed(1);

export function wobble(x1: number, x2: number, y: number) {
  if (x2 - x1 < 1) return '';
  const yAt = (x: number, fine = 0) => (y + Math.sin(x * .045 + y) * .7 + fine).toFixed(2);
  let d = `M${f(x1)} ${yAt(x1)}`;
  for (let x = x1 + 16; x < x2; x += 16) d += ` L${f(x)} ${yAt(x, Math.sin(x * .13) * .35)}`;
  return d + ` L${f(x2)} ${yAt(x2)}`;
}

export function arrowD(x1: number, y1: number, x2: number, y2: number, bend = .25) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  const cx = mx - dy * bend, cy = my + dx * bend;
  let tx = x2 - cx, ty = y2 - cy;
  const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
  const h = 9, a = .5;
  const rot = (x: number, y: number, g: number) => [x * Math.cos(g) - y * Math.sin(g), x * Math.sin(g) + y * Math.cos(g)];
  const [ax, ay] = rot(-tx, -ty, a), [bx, by] = rot(-tx, -ty, -a);
  return `M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)} M${f(x2 + ax * h)} ${f(y2 + ay * h)} L${f(x2)} ${f(y2)} L${f(x2 + bx * h)} ${f(y2 + by * h)}`;
}
