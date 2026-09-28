import Phaser from 'phaser';

/** Phaser owns the clock and presents the current canvas art as a scene image. */
class BastionScene extends Phaser.Scene {
  private frameTexture: Phaser.Textures.CanvasTexture | null = null;
  private readonly artCanvas: HTMLCanvasElement;
  private readonly tick: () => void;
  private readonly logicalWidth: number;
  private readonly logicalHeight: number;

  constructor(artCanvas: HTMLCanvasElement, tick: () => void, width: number, height: number) {
    super({ key: 'bastion' });
    this.artCanvas = artCanvas;
    this.tick = tick;
    this.logicalWidth = width;
    this.logicalHeight = height;
  }

  create(): void {
    this.frameTexture = this.textures.addCanvas('bastion-frame', this.artCanvas);
    this.add.image(this.logicalWidth / 2, this.logicalHeight / 2, 'bastion-frame')
      .setDisplaySize(this.logicalWidth, this.logicalHeight);
  }

  update(): void {
    this.tick();
    // Required for WebGL and harmless for the Canvas renderer used here.
    this.frameTexture?.refresh();
  }
}

export function startPhaserScene(
  canvas: HTMLCanvasElement, artCanvas: HTMLCanvasElement,
  tick: () => void, width: number, height: number,
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    canvas,
    width,
    height,
    transparent: true,
    banner: false,
    scene: new BastionScene(artCanvas, tick, width, height),
  });
  return game;
}
