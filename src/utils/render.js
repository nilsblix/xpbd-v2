import { Vector2 } from "./math.js";
import { Units } from "./units.js";

export class Render {
  static c;
  static TAU = 2 * Math.PI;

  static bg = {
    // colors: {
    //   background: "#0c0e11",
    //   line1: "#1c1d21",
    //   line2: "#19191f",
    //   line3: "#141417",
    //   line4: "#100f12",
    // },
    colors: {
      background: "#0c0e11",
      line1: "#1c1d21",
      line2: "#151719",
      line3: "#111215",
      line4: "#0e1013",
    },
    dist: {
      line1: 1,
      line2: 0.25,
      line3: 0.125,
      line4: 0.0625,
    },
    widths: {
      line1: 0.009,
      line2: 0.007,
      line3: 0.004,
      line4: 0.002,
    }
  }

  /**
   * Initializes the interface. All of the rendering is not called here. Some may be done outside but since c is a reference it doesn't matter
   *
   * @param {CanvasRenderingContext2D} c
   */
  static init(c) {
    this.c = c;
  }

  /**
   * Draws a circle
   * @param {Vector2} pos SIM
   * @param {number} radius SIM
   * @param {boolean} stroke
   * @param {boolean} fill
   */
  static arc(pos, radius, stroke = true, fill = true) {
    this.c.beginPath();
    this.c.arc(
      Units.s2c_x(pos),
      Units.s2c_y(pos),
      Units.mult_s2c * radius,
      0,
      this.TAU,
    );
    if (fill) this.c.fill();
    if (stroke) this.c.stroke();
    this.c.closePath();
  }

  /**
   * Draws a rectangle at SIM position and dimensions
   * @param {Vector2} pos SIM
   * @param {Vector2} dimensions SIM
   * @param {boolean} stroke
   * @param {boolean} fill
   */
  static rect(pos, dimensions, stroke = true, fill = true) {
    this.c.beginPath();
    this.c.rect(
      Units.s2c_x(pos),
      Units.s2c_y(pos),
      Units.mult_s2c * dimensions.x,
      -Units.mult_s2c * dimensions.y,
    );
    if (fill) this.c.fill();
    if (stroke) this.c.stroke();
    this.c.closePath();
  }

  /**
   * Draws a line from a to b
   * OBS Uses only stroke color to fill
   * @param {Vector2} a SIM
   * @param {Vector2} b SIM
   */
  static line(a, b) {
    this.c.beginPath();
    this.c.moveTo(Units.s2c_x(a), Units.s2c_y(a));
    this.c.lineTo(Units.s2c_x(b), Units.s2c_y(b));
    this.c.stroke();
    this.c.closePath();
  }

  /**
   * Draws a polygon
   * @param {[Vector2]} vertices SIM-SPACE
   * @param {boolean} stroke
   * @param {boolean} fill
   */
  static polygon(vertices, stroke = true, fill = true) {
    this.c.beginPath();

    const canv_vert = [];
    for (let i = 0; i < vertices.length; i++) {
      canv_vert.push(Units.s2c(vertices[i]));
    }

    this.c.moveTo(canv_vert[0].x, canv_vert[0].y);
    for (let i = 1; i < canv_vert.length; i++) {
      this.c.lineTo(canv_vert[i].x, canv_vert[i].y);
    }
    this.c.lineTo(canv_vert[0].x, canv_vert[0].y);
    if (fill) this.c.fill();
    if (stroke) this.c.stroke();
    this.c.closePath();
  }

  static renderBackground() {
    Render.c.fillStyle = this.bg.colors.background;
    Render.c.fillRect(0, 0, Units.canvas.width, Units.canvas.height);

    Render.c.strokeStyle = this.bg.colors.line4;
    Render.c.lineWidth = this.bg.widths.line4 * Units.mult_s2c;
    for (let x = Math.floor(Units.MIN.x); x < Units.MAX.x; x += this.bg.dist.line4) {
      this.line(new Vector2(x, Units.MIN.y), new Vector2(x, Units.MAX.y));
    }
    for (let y = Math.floor(Units.MIN.y); y < Units.MAX.y; y += this.bg.dist.line4) {
      this.line(new Vector2(Units.MIN.x, y), new Vector2(Units.MAX.x, y));
    }

    Render.c.strokeStyle = this.bg.colors.line3;
    Render.c.lineWidth = this.bg.widths.line3 * Units.mult_s2c;
    for (let x = Math.floor(Units.MIN.x); x < Units.MAX.x; x += this.bg.dist.line3) {
      this.line(new Vector2(x, Units.MIN.y), new Vector2(x, Units.MAX.y));
    }
    for (let y = Math.floor(Units.MIN.y); y < Units.MAX.y; y += this.bg.dist.line3) {
      this.line(new Vector2(Units.MIN.x, y), new Vector2(Units.MAX.x, y));
    }

    Render.c.strokeStyle = this.bg.colors.line2;
    Render.c.lineWidth = this.bg.widths.line2 * Units.mult_s2c;
    for (let x = Math.floor(Units.MIN.x); x < Units.MAX.x; x += this.bg.dist.line2) {
      this.line(new Vector2(x, Units.MIN.y), new Vector2(x, Units.MAX.y));
    }
    for (let y = Math.floor(Units.MIN.y); y < Units.MAX.y; y += this.bg.dist.line2) {
      this.line(new Vector2(Units.MIN.x, y), new Vector2(Units.MAX.x, y));
    }

    Render.c.strokeStyle = this.bg.colors.line1;
    Render.c.lineWidth = this.bg.widths.line1 * Units.mult_s2c;
    for (let x = Math.floor(Units.MIN.x); x < Units.MAX.x; x += this.bg.dist.line1) {
      this.line(new Vector2(x, Units.MIN.y), new Vector2(x, Units.MAX.y));
    }
    for (let y = Math.floor(Units.MIN.y); y < Units.MAX.y; y += this.bg.dist.line1) {
      this.line(new Vector2(Units.MIN.x, y), new Vector2(Units.MAX.x, y));
    }

  }

  static HSV_RGB(h, s, v) {
    let r, g, b;

    // Normalize hue to be between 0 and 360 degrees
    h = h % 360;

    // Normalize saturation and value to be between 0 and 1
    s = s / 100;
    v = v / 100;

    let c = v * s; // Chroma
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1)); // Second largest component
    let m = v - c;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    // Add the adjustment factor to match the value (lightness)
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return { r: r, g: g, b: b };
  }
}
