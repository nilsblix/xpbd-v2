export class Vector2 {
  static zero = new Vector2(0, 0);
  static up = new Vector2(0, 1);
  static down = new Vector2(0, -1);
  static left = new Vector2(-1, 0);
  static right = new Vector2(1, 0);

  constructor(x = 0.0, y = 0.0) {
    this.x = x;
    this.y = y;
  }

  /**
   * @returns {Vector2}
   */
  clone() {
    return new Vector2(this.x, this.y);
  }

  /**
   * Sets the current vector to this vector
   * @param {Vector2} v
   * @returns {Vector2} returns this
   */
  set(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /**
   * @param {Vector2} v
   * @returns {Vector2}
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * @param {Vector2} a
   * @param {Vector2} b
   * @returns {Vector2}
   */
  static add(a, b) {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  /**
   * @param {Vector2} v
   * @returns {Vector2}
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * @param {Vector2} a
   * @param {Vector2} b
   * @returns {Vector2}
   */
  static sub(a, b) {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  /**
   * @param {number} s
   * @returns {Vector2}
   */
  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  /**
   * @param {number} s
   * @param {Vector2} v
   * @returns {Vector2}
   */
  static scale(s, v) {
    return new Vector2(s * v.x, s * v.y);
  }

  /**
   * @returns {number}
   * Squared magnitude
   */
  sqr_magnitude() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * @returns {number}
   * Magnitude
   */
  magnitude() {
    return Math.sqrt(this.sqr_magnitude());
  }

  /**
   * @param {Vector2} v
   * @returns {number}
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * @param {Vector2} a
   * @param {Vector2} b
   */
  static distance(a, b) {
    return Vector2.sub(a, b).magnitude();
  }

  /**
   * @param {Vector2} a
   * @param {Vector2} b
   */
  static sqr_distance(a, b) {
    return Vector2.sub(a, b).sqr_magnitude();
  }

  /**
   * Rotates the current vector around the z-axis by "theta" radians.
   * @param {number} theta
   * @returns {Vector2} this
   */
  rotateByAngle(theta) {
    const x_prime = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    const y_prime = this.x * Math.sin(theta) + this.y * Math.cos(theta);
    this.x = x_prime;
    this.y = y_prime;
    return this;
  }

  /**
   * Returns the vector v rotated theta radians around (0,0)
   * @param {Vector2} v
   * @param {number} theta
   * @returns {Vector2}
   */
  static rotateByAngle(v, theta) {
    const x_prime = v.x * Math.cos(theta) - v.y * Math.sin(theta);
    const y_prime = v.x * Math.sin(theta) + v.y * Math.cos(theta);
    return new Vector2(x_prime, y_prime);
  }

  /**
   * Rotates this vector around some arbitrary point with some angle theta radians
   * @param {number} theta
   * @param {Vector2} point
   * @returns {Vector2} this
   */
  rotateAroundPoint(theta, point = Vector2.zero) {
    this.sub(point);
    this.rotateByAngle(theta);
    this.add(point);
    return this;
  }

  /**
   * Returns the vector v rotated theta radians around point
   * @param {Vector2} v
   * @param {number} theta
   * @param {Vector2} point
   * @returns {Vector2}
   */
  static rotateAroundPoint(v, theta, point) {
    const a = v.clone().sub(point);
    a.rotateByAngle(theta);
    a.add(point);
    return a;
  }

  /**
   * Returns the negated version of this vector. This has been changed
   * @returns {number}
   */
  negate() {
    this.x *= -1;
    this.y *= -1;
    return this;
  }

  /**
   * @param {Vector2} v
   * @returns {Vector2}
   */
  static negate(v) {
    return new Vector2(-v.x, -v.y);
  }

  /**
   * @returns {Vector2} The negated version of this, This hasnt been changed.
   */
  negated() {
    return new Vector2(-this.x, -this.y);
  }

  /**
   * @returns {Vector2}
   */
  normalize() {
    const dist = this.magnitude();
    this.x /= dist;
    this.y /= dist;
  }

  /**
   *
   * @returns {Vector2} The nornalized version if this. This has not been changed.
   */
  normalized() {
    return Vector2.scale(1 / this.magnitude(), this);
  }

  /**
   * The 2d cross product between two vectors
   * @param {Vector2} a
   * @param {Vector2} b
   * @returns {number}
   */
  static cross(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  /**
   *
   * @param {Vector2} a
   * @param {Vector2} b
   * @param {Vector2} c
   * @returns
   */
  static tripleProduct(a, b, c) {
    const cross = Vector2.cross(b, c);
    return new Vector2(a.y * cross, a.x * cross);
  }

  /**
   *
   * @param {Vector2} a
   * @param {Vector2} b
   * @returns {number} The distance between the line a --> b and this.
   */
  distanceToLine(a, b) {
    const t_no_limit =
      -Vector2.sub(a, this).dot(Vector2.sub(b, a)) /
      Vector2.sub(b, a).sqr_magnitude();
    const t = Math.max(0, Math.min(1, t_no_limit));
    const d =
      (a.x - this.x + t * (b.x - a.x)) ** 2 +
      (a.y - this.y + t * (b.y - a.y)) ** 2;
    return Math.sqrt(d);
  }

  /**
   * @returns {string}
   */
  toString() {
    return "x: " + this.x + " y: " + this.y;
  }

  /**
   * @param {Vector2} v
   * @returns {boolean}
   */
  equals(v) {
    return this.x == v.x && this.y == v.y;
  }

  toJSON() {
    return { x: this.x, y: this.y };
  }

  static fromJSON(data) {
    return new Vector2(data.x, data.y);
  }
}
