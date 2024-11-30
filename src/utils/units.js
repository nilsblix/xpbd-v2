import { Vector2 } from "./math.js";

export class Units {
  static WIDTH = 10;
  static RATIO = 16 / 9;
  static HEIGHT = this.WIDTH / this.RATIO;

  static DIMS = new Vector2(undefined, undefined);

  static mult_c2s;
  static mult_s2c;

  static canvas = { width: 0, height: 0 };

  static NUM_LINES = { x: 40, y: 40 / this.RATIO };

  /**
   * @param {HTMLCanvasElement} canvas
   */
  static init(canvas) {
    const window_ratio = window.innerWidth / window.innerHeight;
    if (window_ratio > this.RATIO) {
      canvas.height = 1 * window.innerHeight;
      canvas.width = canvas.height * this.RATIO;
    } else {
      canvas.width = 1 * window.innerWidth;
      canvas.height = canvas.width / this.RATIO;
    }

    this.canvas.width = canvas.width;
    this.canvas.height = canvas.height;

    this.mult_c2s = this.WIDTH / canvas.width;
    this.mult_s2c = canvas.width / this.WIDTH;

    this.DIMS.set(new Vector2(this.WIDTH, this.HEIGHT));
  }

  /**
   * @param {Vector2} pos
   * @returns {number}
   */
  static c2s_x(pos) {
    return (this.WIDTH * pos.x) / this.canvas.width;
  }

  /**
   * @param {Vector2} pos
   * @returns {number}
   */
  static c2s_y(pos) {
    return (this.HEIGHT * (this.canvas.height - pos.y)) / this.canvas.height;
  }

  /**
   * @param {Vector2} pos
   * @returns {Vector2}
   */
  static c2s(pos) {
    return new Vector2(this.c2s_x(pos), this.c2s_y(pos));
  }

  /**
   * @param {Vector2} pos
   * @returns {number}
   */
  static s2c_x(pos) {
    return (this.canvas.width * pos.x) / this.WIDTH;
  }

  /**
   * @param {Vector2} pos
   * @returns {number}
   */
  static s2c_y(pos) {
    return (this.canvas.height * (this.HEIGHT - pos.y)) / this.HEIGHT;
  }

  /**
   * @param {Vector2} pos
   * @returns {Vector2}
   */
  static s2c(pos) {
    return new Vector2(this.s2c_x(pos), this.s2c_y(pos));
  }

  /**
   * @param {Vector2} pos
   * @returns {number}
   */
  static snap_to_grid_x(pos) {
    const l_x = 2 * this.NUM_LINES.x;
    const x = pos.x + (0.5 * this.WIDTH) / l_x;
    return (this.WIDTH / l_x) * Math.floor((l_x / this.WIDTH) * x);
  }

  /**
   * @param {Vector2} pos
   * @returns {number}
   */
  static snap_to_grid_y(pos) {
    const l_y = 2 * this.NUM_LINES.y;
    const y = pos.y + (0.5 * this.HEIGHT) / l_y;
    return (this.HEIGHT / l_y) * Math.floor((l_y / this.HEIGHT) * y);
  }

  /**
   * @param {Vector2} pos
   * @returns {Vector2}
   */
  static snap_to_grid(pos) {
    return new Vector2(this.snap_to_grid_x(pos), this.snap_to_grid_y(pos));
  }

  /**
   * @param {number} x Value that should be mapped
   * @param {number} x1 Original min value
   * @param {number} x2 Original max value
   * @param {number} r1 New min value
   * @param {number} r2 New max Value
   * @returns {number}
   */
  static map(x, x1, x2, r1, r2) {
    return r1 + ((x - x1) * (r1 - r2)) / (x1 - x2);
  }

  /**
   * @param {number} min Inclusive
   * @param {number} max Exclusive
   * @returns {number} Integer between min and max
   */
  static random(min, max) {
    return Math.floor((max - min) * Math.random()) + min;
  }
}
