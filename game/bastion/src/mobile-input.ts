export const pinchScale = (scale: number, initialDistance: number, distance: number): number =>
  Math.max(1, Math.min(3, scale * Math.max(1, distance) / Math.max(1, initialDistance)));
export const gestureIsTap = (start: { startX: number; startY: number; moved: boolean }, x: number, y: number, pinched: boolean): boolean =>
  !pinched && !start.moved && Math.hypot(x - start.startX, y - start.startY) <= 10;
export const fittedMapWidth = (width: number, height: number, ratio: number): number => Math.max(1, Math.min(width, height * ratio));
