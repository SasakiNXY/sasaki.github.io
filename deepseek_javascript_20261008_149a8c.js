export class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.mouseButtons = new Set();
    this.justPressed = new Set();
    this.pointerLocked = false;

    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
      this.justPressed.add('Mouse' + e.button);
    });
    window.addEventListener('mouseup', (e) => this.mouseButtons.delete(e.button));
    window.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement !== null;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isKeyDown(code) { return this.keys.has(code); }
  isMouseDown(btn = 0) { return this.mouseButtons.has(btn); }
  wasPressed(code) { return this.justPressed.has(code); }

  consumeMouseDelta() {
    const d = { x: this.mouseDX, y: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return d;
  }

  endFrame() { this.justPressed.clear(); }
}