import { Render } from "./utils/render.js";
import {
  Colors,
  LineWidths,
  RenderConstants,
} from "./settings/render_settings.js";
import { Units } from "./utils/units.js";
import { Vector2 } from "./utils/math.js";
import { PhysicsSystem } from "./physics_system.js";
import { RigidBody } from "./rigid_body.js";

/*
    All constraints must have these methods:
        solve(bodies)
            Solves the constraint
        getConstraintForce()
            Returns the force the constraint is applying
        render(bodies)
            Renders the constraint
*/

export class OffsetLinkConstraint {
  /**
   * @param {number} alpha Compliancy
   * @param {number} id1
   * @param {number} id2
   * @param {number} r1 Local space to body 1
   * @param {number} r2 Local space to body 2
   * @param {number} l0 rest length
   */
  constructor(alpha, id1, id2, r1, r2, l0) {
    this.alpha = alpha;

    this.id1 = id1;
    this.r1 = r1;
    this.id2 = id2;
    this.r2 = r2;
    this.l0 = l0;

    this.lambda = null;
    this.n = Vector2.zero.clone();
    this.C = null;
  }

  /**
   * @param {[]} bodies
   * @returns {void}
   */
  solve(bodies) {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    const k = this.alpha / (sub_dt * sub_dt);

    const b1 = bodies[this.id1];
    const b2 = bodies[this.id2];

    const world_1 = b1.localToWorld(this.r1);
    const world_2 = b2.localToWorld(this.r2);

    const dist2 = Vector2.sqr_distance(world_1, world_2);
    this.C = dist2 - this.l0 ** 2;
    this.n = Vector2.scale(1 / Math.sqrt(dist2), Vector2.sub(world_2, world_1));

    const delta_a = Vector2.sub(world_2, world_1);

    const sin_1 = Math.sin(b1.theta);
    const cos_1 = Math.cos(b1.theta);
    const sin_2 = Math.sin(b2.theta);
    const cos_2 = Math.cos(b2.theta);

    const dC_dx1 = -2 * delta_a.x;
    const dC_dy1 = -2 * delta_a.y;
    const dC_dtheta1 =
      2 *
      ((this.r1.x * sin_1 + this.r1.y * cos_1) * delta_a.x +
        (-this.r1.x * cos_1 + this.r1.y * sin_1) * delta_a.y);

    const dC_dx2 = 2 * delta_a.x;
    const dC_dy2 = 2 * delta_a.y;
    const dC_dtheta2 =
      2 *
      ((-this.r2.x * sin_2 - this.r2.y * cos_2) * delta_a.x +
        (this.r2.x * cos_2 - this.r2.y * sin_2) * delta_a.y);

    const w_1 =
      (dC_dx1 * dC_dx1 + dC_dy1 * dC_dy1) / b1.mass +
      (dC_dtheta1 * dC_dtheta1) / b1.I;
    const w_2 =
      (dC_dx2 * dC_dx2 + dC_dy2 * dC_dy2) / b2.mass +
      (dC_dtheta2 * dC_dtheta2) / b2.I;

    this.lambda = -this.C / (w_1 + w_2 + k);

    const delta_p1 = Vector2.scale(
      this.lambda / b1.mass,
      new Vector2(dC_dx1, dC_dy1),
    );
    const delta_p2 = Vector2.scale(
      this.lambda / b2.mass,
      new Vector2(dC_dx2, dC_dy2),
    );

    b1.pos = Vector2.add(b1.pos, delta_p1);
    b2.pos = Vector2.add(b2.pos, delta_p2);

    b1.theta += (this.lambda * dC_dtheta1) / b1.I;
    b2.theta += (this.lambda * dC_dtheta2) / b2.I;
  }

  /**
   * n is from body 1 to body 2
   * @returns {Vector2} the force the constraint is applying.
   */
  getConstraintForce() {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    return Vector2.scale(this.lambda / (sub_dt * sub_dt), this.n);
  }

  render(bodies) {
    const b1 = bodies[this.id1];
    const b2 = bodies[this.id2];

    const a1 = b1.localToWorld(this.r1);
    const a2 = b2.localToWorld(this.r2);

    Render.c.lineCap = "round";

    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth =
      (LineWidths.link_constraint + LineWidths.lines_outlines) * Units.mult_s2c;
    Render.line(a1, a2);

    Render.c.strokeStyle = Colors.link_constraint;
    Render.c.lineWidth = LineWidths.link_constraint * Units.mult_s2c;
    Render.line(a1, a2);

    const rad = LineWidths.link_constraint / 4;
    Render.c.fillStyle = Colors.outlines;
    Render.arc(a1, rad, false, true);
    Render.arc(a2, rad, false, true);
  }

  toJSON() {
    return {
      alpha: this.alpha,
      id1: this.id1,
      r1: this.r1.toJSON(),
      id2: this.id2,
      r2: this.r2.toJSON(),
      l0: this.l0,
      lambda: this.lambda,
      n: this.n.toJSON(),
      C: this.C,
    };
  }

  static fromJSON(data) {
    const r1 = Vector2.fromJSON(data.r1);
    const r2 = Vector2.fromJSON(data.r2);
    const n = Vector2.fromJSON(data.n);
    const joint = new OffsetLinkConstraint(
      data.alpha,
      data.id1,
      data.id2,
      r1,
      r2,
      data.l0,
    );
    joint.lambda = data.lambda;
    joint.n = n;
    joint.C = data.C;
    return joint;
  }
}

export class PrismaticYConstraint {
  /**
   * @param {number} alpha Compliancy
   * @param {*} id
   * @param {*} r Offset LOCAL-SPACE
   * @param {*} y0 Target y-value
   */
  constructor(alpha, id, r, y0) {
    this.alpha = alpha;

    this.id = id;
    this.r = r;
    this.y0 = y0;

    this.lambda = null;
    this.n = new Vector2(0, 1);
    this.C = null;
  }

  solve(bodies) {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    const k = this.alpha / (sub_dt * sub_dt);

    const b = bodies[this.id];

    const world_y =
      b.pos.y + this.r.x * Math.sin(b.theta) + this.r.y * Math.cos(b.theta);

    this.C = world_y - this.y0;
    const dC_dtheta =
      this.r.x * Math.cos(b.theta) - this.r.y * Math.sin(b.theta);

    const w = 1 / b.mass + (dC_dtheta * dC_dtheta) / b.I;

    this.lambda = -this.C / (w + k);

    b.pos = Vector2.add(b.pos, Vector2.scale(this.lambda / b.mass, this.n));
    b.theta += (this.lambda * dC_dtheta) / b.I;
  }

  getConstraintForce() {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    return Vector2.scale(this.lambda / (sub_dt * sub_dt), this.n);
  }

  render(bodies) {
    const b = bodies[this.id];

    const applied = b.localToWorld(this.r);
    const rad = LineWidths.fixed_y_constraint_rad;

    Render.c.fillStyle = Colors.fixed_y_constraint;
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth = LineWidths.fixed_constraints_outlines * Units.mult_s2c;

    Render.rect(
      Vector2.sub(applied, new Vector2(rad, 2 * rad)),
      new Vector2(2 * rad, 2 * rad),
      true,
      true,
    );
    Render.arc(applied, rad, true, true);
    Render.c.fillStyle = Colors.outlines;
    Render.arc(applied, rad / 4, true, true);

    // 1 2 middle 3 4
    const horizontal_middle = Vector2.add(applied, new Vector2(0.0, -2 * rad));
    const horizontal_1 = Vector2.add(
      horizontal_middle,
      new Vector2(-4 * rad, 0.0),
    );
    const horizontal_2 = Vector2.add(
      horizontal_middle,
      new Vector2(-2 * rad, 0.0),
    );
    const horizontal_3 = Vector2.add(
      horizontal_middle,
      new Vector2(2 * rad, 0.0),
    );
    const horizontal_4 = Vector2.add(
      horizontal_middle,
      new Vector2(4 * rad, 0.0),
    );

    Render.c.lineCap = "round";
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth =
      (LineWidths.fixed_constraints_lines +
        2 * LineWidths.fixed_constraints_outlines) *
      Units.mult_s2c;
    Render.line(horizontal_1, horizontal_4);

    Render.c.strokeStyle = Colors.fixed_y_constraint;
    Render.c.lineWidth = LineWidths.fixed_constraints_lines * Units.mult_s2c;
    Render.line(horizontal_1, horizontal_4);

    // START OF REAL FIXED Y. What came before was essentially fixed pos constraint

    const fix = LineWidths.fixed_constraints_lines;

    const small_rad = rad / 1.5;
    const ball_1 = Vector2.add(
      horizontal_1,
      new Vector2(small_rad, -small_rad - fix),
    );
    const ball_2 = Vector2.add(
      horizontal_2,
      new Vector2(0.5 * small_rad, -small_rad - fix),
    );
    const ball_3 = Vector2.add(
      horizontal_middle,
      new Vector2(0.0, -small_rad - fix),
    );
    const ball_4 = Vector2.add(
      horizontal_3,
      new Vector2(-0.5 * small_rad, -small_rad - fix),
    );
    const ball_5 = Vector2.add(
      horizontal_4,
      new Vector2(-small_rad, -small_rad - fix),
    );

    Render.c.strokeStyle = Colors.outlines;
    Render.c.fillStyle = Colors.fixed_y_constraint;
    Render.c.lineWidth = LineWidths.fixed_constraints_outlines * Units.mult_s2c;

    Render.arc(ball_1, small_rad, true, true);
    Render.arc(ball_2, small_rad, true, true);
    Render.arc(ball_3, small_rad, true, true);
    Render.arc(ball_4, small_rad, true, true);
    Render.arc(ball_5, small_rad, true, true);
  }

  toJSON() {
    return {
      alpha: this.alpha,
      id: this.id,
      r: this.r.toJSON(),
      y0: this.y0,
      lambda: this.lambda,
      n: this.n.toJSON(),
      C: this.C,
    };
  }

  static fromJSON(data) {
    const r = Vector2.fromJSON(data.r);
    const n = Vector2.fromJSON(data.n);
    const joint = new PrismaticYConstraint(data.alpha, data.id, r, data.y0);
    joint.lambda = data.lambda;
    joint.n = n;
    joint.C = data.C;
    return joint;
  }
}

export class PrismaticPosConstraint {
  /**
   * @param {number} alpha Compliancy
   * @param {number} id
   * @param {Vector2} r Offset LOCAL-SPACE
   * @param {Vector2} p0 Target position
   */
  constructor(alpha, id, r, p0) {
    this.alpha = alpha;

    this.id = id;
    this.r = r;
    this.p0 = p0;

    this.lambda = 0;
    this.n = Vector2.zero.clone();
    this.C = 0;
  }

  solve(bodies) {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    const k = this.alpha / (sub_dt * sub_dt);

    const b = bodies[this.id];

    const a = b.localToWorld(this.r);

    const delta_x = a.x - this.p0.x;
    const delta_y = a.y - this.p0.y;

    this.C = delta_x * delta_x + delta_y * delta_y;
    if (this.C < PhysicsSystem.EPS) return;

    const dC_dx = 2 * delta_x;
    const dC_dy = 2 * delta_y;
    const dC_dtheta =
      2 *
        delta_x *
        (-this.r.x * Math.sin(b.theta) - this.r.y * Math.cos(b.theta)) +
      2 *
        delta_y *
        (this.r.x * Math.cos(b.theta) - this.r.y * Math.sin(b.theta));

    const w =
      (dC_dx * dC_dx + dC_dy * dC_dy) / b.mass + (dC_dtheta * dC_dtheta) / b.I;

    this.lambda = -this.C / (w + k);

    this.n.set(new Vector2(dC_dx, dC_dy));
    b.pos = Vector2.add(b.pos, Vector2.scale(this.lambda / b.mass, this.n));
    b.theta += (this.lambda * dC_dtheta) / b.I;

    // this.n.set(this.n.normalize());
  }

  getConstraintForce() {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    return Vector2.scale(this.lambda / (sub_dt * sub_dt), this.n);
  }

  render(bodies) {
    const b = bodies[this.id];

    const applied = b.localToWorld(this.r);
    const rad = LineWidths.fixed_y_constraint_rad;

    Render.c.fillStyle = Colors.fixed_y_constraint;
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth = LineWidths.fixed_constraints_outlines * Units.mult_s2c;

    Render.rect(
      Vector2.sub(applied, new Vector2(rad, 2 * rad)),
      new Vector2(2 * rad, 2 * rad),
      true,
      true,
    );
    Render.arc(applied, rad, true, true);
    Render.c.fillStyle = Colors.outlines;
    Render.arc(applied, rad / 4, true, true);

    // 1 2 middle 3 4
    const horizontal_middle = Vector2.add(applied, new Vector2(0.0, -2 * rad));
    const horizontal_1 = Vector2.add(
      horizontal_middle,
      new Vector2(-4 * rad, 0.0),
    );
    // const horizontal_2 = Vector2.add(horizontal_middle, new Vector2(- 2 * rad, 0.0));
    // const horizontal_3 = Vector2.add(horizontal_middle, new Vector2(  2 * rad, 0.0));
    const horizontal_4 = Vector2.add(
      horizontal_middle,
      new Vector2(4 * rad, 0.0),
    );

    Render.c.lineCap = "round";
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth =
      (LineWidths.fixed_constraints_lines +
        2 * LineWidths.fixed_constraints_outlines) *
      Units.mult_s2c;
    Render.line(horizontal_1, horizontal_4);

    Render.c.strokeStyle = Colors.fixed_y_constraint;
    Render.c.lineWidth = LineWidths.fixed_constraints_lines * Units.mult_s2c;
    Render.line(horizontal_1, horizontal_4);
  }

  toJSON() {
    return {
      alpha: this.alpha,
      id: this.id,
      r: this.r.toJSON(),
      p0: this.p0.toJSON(),
      lambda: this.lambda,
      n: this.n.toJSON(),
      C: this.C,
    };
  }

  static fromJSON(data) {
    const r = Vector2.fromJSON(data.r);
    const p0 = Vector2.fromJSON(data.p0);
    const n = Vector2.fromJSON(data.n);
    const joint = new PrismaticPosConstraint(data.alpha, data.id, r, p0);
    joint.lambda = data.lambda;
    joint.n = n;
    joint.C = data.C;
    return joint;
  }
}

export class RevoluteJoint {
  constructor(alpha, id1, id2, r1, r2) {
    this.alpha = alpha;

    this.id1 = id1;
    this.id2 = id2;
    this.r1 = r1;
    this.r2 = r2;

    this.lambda = 0;
    this.n = Vector2.zero.clone();
    this.C = 0;
  }

  solve(bodies) {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    const k = this.alpha / (sub_dt * sub_dt);

    const body1 = bodies[this.id1];
    const body2 = bodies[this.id2];

    const a_p1 = body1.localToWorld(this.r1);
    const a_p2 = body2.localToWorld(this.r2);

    const delta_x = a_p1.x - a_p2.x;
    const delta_y = a_p1.y - a_p2.y;

    this.C = delta_x * delta_x + delta_y * delta_y;
    if (this.C < PhysicsSystem.EPS) return;

    const dC_dx1 = 2 * delta_x;
    const dC_dy1 = 2 * delta_y;
    const dC_dtheta1 =
      2 *
        delta_x *
        (-Math.sin(body1.theta) * this.r1.x -
          Math.cos(body1.theta) * this.r1.y) +
      2 *
        delta_y *
        (Math.cos(body1.theta) * this.r1.x - Math.sin(body1.theta) * this.r1.y);

    const dC_dx2 = -2 * delta_x;
    const dC_dy2 = -2 * delta_y;
    const dC_dtheta2 =
      2 *
        delta_x *
        (Math.sin(body2.theta) * this.r2.x +
          Math.cos(body2.theta) * this.r2.y) +
      2 *
        delta_y *
        (-Math.cos(body2.theta) * this.r2.x +
          Math.sin(body2.theta) * this.r2.y);

    const w_1 =
      (dC_dx1 * dC_dx1 + dC_dy1 * dC_dy1) / body1.mass +
      (dC_dtheta1 * dC_dtheta1) / body1.I;
    const w_2 =
      (dC_dx2 * dC_dx2 + dC_dy2 * dC_dy2) / body2.mass +
      (dC_dtheta2 * dC_dtheta2) / body2.I;

    this.lambda = -this.C / (w_1 + w_2 + k);

    const delta_p1 = Vector2.scale(
      this.lambda / body1.mass,
      new Vector2(dC_dx1, dC_dy1),
    );
    const delta_p2 = Vector2.scale(
      this.lambda / body2.mass,
      new Vector2(dC_dx2, dC_dy2),
    );

    body1.pos.set(Vector2.add(body1.pos, delta_p1));
    body2.pos.set(Vector2.add(body2.pos, delta_p2));

    body1.theta += (this.lambda * dC_dtheta1) / body1.I;
    body2.theta += (this.lambda * dC_dtheta2) / body2.I;
  }

  getConstraintForce() {
    const sub_dt = PhysicsSystem.dt / PhysicsSystem.sub_steps;
    return Vector2.scale(this.lambda / (sub_dt * sub_dt), this.n);
  }

  render(bodies) {
    const body1 = bodies[this.id1];
    const body2 = bodies[this.id2];

    // I'll use the average between these two, even though they should be the same
    const a1 = body1.localToWorld(this.r1);
    const a2 = body2.localToWorld(this.r2);
    const a = Vector2.scale(1 / 2, Vector2.add(a1, a2));

    Render.c.lineWidth = LineWidths.revolute_joint * Units.mult_s2c;
    Render.c.strokeStyle = Colors.outlines;
    Render.c.fillStyle = Colors.revolute_joint;
    Render.arc(a, RenderConstants.revolute_joint_radius, true, true);

    Render.c.fillStyle = Colors.outlines;
    Render.arc(a, RenderConstants.revolute_joint_radius / 3, true, true);
  }

  toJSON() {
    return {
      alpha: this.alpha,
      id1: this.id1,
      r1: this.r1.toJSON(),
      id2: this.id2,
      r2: this.r2.toJSON(),
      lambda: this.lambda,
      n: this.n.toJSON(),
      C: this.C,
    };
  }

  static fromJSON(data) {
    const r1 = Vector2.fromJSON(data.r1);
    const r2 = Vector2.fromJSON(data.r2);
    const n = Vector2.fromJSON(data.n);
    const joint = new RevoluteJoint(data.alpha, data.id1, data.id2, r1, r2);
    joint.lambda = data.lambda;
    joint.n = n;
    joint.C = data.C;
    return joint;
  }
}

export class CollisionConstraint {
  constructor(id1, id2) {
    this.alpha = 0.0;

    this.id1 = id1;
    this.id2 = id2;

    this.lambda_n = 0; // normal
    this.lambda_t = 0; // tangent
    this.n = Vector2.zero.clone();
    this.C = 0;
  }

  solve(bodies) {
    const b1 = bodies[this.id1];
    const b2 = bodies[this.id2];
    const contacts = this.getCollisionManifolds(b1, b2);

    for (let i = 0; i < contacts.length; i++) {
      const cp = contacts[i];
      Render.c.fillStyle = "#ff0000";
      Render.arc(cp, 0.08, false, true);
    }

  }

  /**
  *
  * @param {RigidBody} b1
  * @param {RigidBody} b2
  * @returns {[Vector2]} If the point is false, then it is not a valid contact manifold
  */
  getCollisionManifolds(b1, b2) {
    const { reference_id, reference_edge, collides, collision_normal, collision_penetration } = this.SAT(b1, b2);
    if (!collides) return false;

    const incident_edge = reference_id == 1
      ? b2.getEdgeWithHighestDot(b1, collision_normal)
      : b1.getEdgeWithHighestDot(b1, collision_normal);

    const getNormal = (origin, vec) => {
      const normal = new Vector2(-vec.x, vec.y);
      if (normal.dot(origin))
        normal.negate();
      return normal;
    }

    const A1 = reference_edge.v1;
    const A2 = reference_edge.v2;
    const B1 = incident_edge.v1;
    const B2 = incident_edge.v2;
    const N1 = getNormal(Vector2.sub(A1, A2), collision_normal);
    const N2 = getNormal(Vector2.sub(A2, A1), collision_normal);

    const delta_Bx = B2.x - B1.x;
    const delta_By = B2.y - B1.y;
    const den = (N1.x * delta_Bx + N1.y * delta_By);
    const t1 = (N1.x * (A1.x - B1.x) + N1.y * (A1.y - B1.y)) / den;
    const t2 = (N2.x * (A2.x - B1.x) + N2.y * (A2.y - B1.y)) / den;

    console.log("t1", t1);
    console.log("t2", t2);

    const inrange = (t) => {
      return t >= 0.0 && t <= 1.0;
    }

    const nB1 = Vector2.add(B1, Vector2.scale(t1, Vector2.sub(B2, B1)));
    const nB2 = Vector2.add(B1, Vector2.scale(t2, Vector2.sub(B2, B1)));

    const res = [];

    if (inrange(t1) && Vector2.sub(nB1, A1).dot(collision_normal) > 0.0)
      res.push(nB1);
    if (inrange(t2) && Vector2.sub(nB2, A2).dot(collision_normal) > 0.0)
      res.push(nB2);

    return res;
  }

  /**
  *
  * @param {RigidBody} b1
  * @param {RigidBody} b2
  * @returns {{reference_id: number, reference_edge: {v1: Vector2, v2: Vector2}, collides: boolean, collision_normal: Vector2, collision_penetration: number}}
  */
  SAT(b1, b2) {
    const e1 = b1.getEdges(b2);
    const e2 = b2.getEdges(b1);

    let collides = false;
    let collision_penetration = null;
    let collision_normal = Vector2.zero.clone();
    let reference_edge = { v1: Vector2.zero.clone(), v2: Vector2.zero.clone() };

    const getNormal = (body, edge) => {
      const v = Vector2.sub(edge.v2, edge.v1).normalized();
      const normal = new Vector2(-v.x, v.y);
      if (normal.dot(Vector2.sub(body.pos, edge.v1)))
        normal.negate();

      Render.c.fillStyle = "#ff00ff";
      Render.arc(normal, 0.08, false, true);
      return normal;
    }

    const collisionHelper = (body, edges) => {
      let debug = "";
      for (let i = 0; i < edges.length; i++) {
        const normal = getNormal(body, edges[i]);
        const proj1 = b1.projectAlongDir(normal);
        const proj2 = b2.projectAlongDir(normal);

        console.log("proj 1");
        console.dir(proj1);

        console.log("proj 2");
        console.dir(proj2);

        debug +=
          "1 " + proj1.low.toFixed(3) + " " + proj1.high.toFixed(3) + " | " + "2 " + proj2.low.toFixed(3) + " " + proj2.high.toFixed(3);

        const penetration = Math.min(
          Math.abs(proj1.low - proj2.high),
          Math.abs(proj1.high - proj2.low)
        );

        if (penetration < collision_penetration || !collision_penetration) {
          collision_penetration = penetration;
          collision_normal = normal;
          reference_edge = edges[i];
        }

        if (proj1.high > proj2.low && proj2.high > proj1.low) {
          collides = true;
          return;
        }
      }
      document.getElementById("custom-easy-debug").innerHTML = debug;
    }

    collisionHelper(b1, e1);
    if (collides) return { reference_id: 1, reference_edge, collides, collision_penetration, collision_normal };
    collisionHelper(b2, e2);
    return { reference_id: 2, reference_edge, collides, collision_penetration, collision_normal };

  }

}
