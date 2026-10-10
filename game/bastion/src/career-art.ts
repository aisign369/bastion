import { FINISHES, type FinishId } from './progression';
const seals = new Map<FinishId, HTMLCanvasElement>();
/** One small cached foundation engraving per finish; combat and the map's original tower stay intact. */
export function careerSeal(finish: FinishId): HTMLCanvasElement | null {
  if (finish === 'standard') return null;
  if (seals.has(finish)) return seals.get(finish)!;
  const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 70;
  const g = canvas.getContext('2d')!, color = FINISHES.find(f => f.id === finish)!.color;
  g.translate(48, 35); g.scale(1, .62); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 1.5;
  if (finish === 'copper') {
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.save(); g.translate(Math.cos(a)*35, Math.sin(a)*35); g.rotate(a); g.beginPath(); g.ellipse(0,0,5,2.5,-.5,0,Math.PI*2); g.fill(); g.restore(); }
  } else if (finish === 'aurora') {
    for(let i=0;i<8;i++){const a=i*Math.PI/4;g.save();g.rotate(a);g.beginPath();g.moveTo(0,-30);g.lineTo(3,-36);g.lineTo(0,-43);g.lineTo(-3,-36);g.closePath();g.stroke();g.restore();}
  } else if (finish === 'solar') {
    for(const side of [-1,1])for(let i=0;i<5;i++){g.beginPath();g.moveTo(side*(25+i*3),-9+i*5);g.lineTo(side*(42-i*2),-14+i*5);g.stroke();}
    g.beginPath();g.arc(0,-34,5,0,Math.PI*2);g.stroke();
  } else {
    g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%4===0?44:i%2===0?35:29;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.stroke();
    for(let i=0;i<4;i++){const a=i*Math.PI/2;g.fillRect(Math.cos(a)*38-2,Math.sin(a)*38-2,4,4);}
  }
  seals.set(finish, canvas); return canvas;
}
