/*
    All bodies should have these things:
    Properties:
        Position
        Velocity
        Force (accumulated through the frame)
        Mass

        Theta (angle)
        Omega (angle vel)
        Tau (accumulated through the frame)
        Inertia
    Methods:
        render
*/

import { Render } from "./utils/render.js";
import { Colors, LineWidths } from "./settings/render_settings.js";
import { Units } from "./utils/units.js";
import { Vector2 } from "./utils/math.js";

export class RigidBody {
  /**
   * @param {Vector2} pos SIM
   * @param {number} mass
   * @param {{type: "disc" || "rect} etc, radius?, vertices?}
   */
  constructor(pos, mass, geometry) {
    this.pos = pos;
    this.prev_pos = pos;
    this.vel = Vector2.zero;
    this.force = Vector2.zero;
    this.mass = mass;

    this.theta = 0;
    this.prev_theta = 0;
    this.omega = 0;
    this.tau = 0;
    this.I;

    this.color = Colors.body_colors[Units.random(0, Colors.body_colors.length)];

    this.geometry = {
      type: geometry.type,
      radius: geometry.radius,
      width: geometry.width,
      height: geometry.height,
      local_vertices: [],
      world_vertices: [], // gets updated in render
    };

    if (geometry.type == "disc") {
      this.I = (1 / 2) * mass * geometry.radius * geometry.radius;
    } else if (geometry.type == "rect") {
      this.I = (1 / 12) * mass * (geometry.width ** 2 + geometry.height ** 2);

      this.geometry.local_vertices = [
        new Vector2(-geometry.width / 2, -geometry.height / 2),
        new Vector2(-geometry.width / 2, geometry.height / 2),
        new Vector2(geometry.width / 2, geometry.height / 2),
        new Vector2(geometry.width / 2, -geometry.height / 2),
      ];
    }
  }

  getKineticEnergy() {
    return (
      (1 / 2) * this.mass * this.vel.sqr_magnitude() +
      (1 / 2) * this.I * Math.abs(this.omega * this.omega)
    );
  }

  pointIsInside(point) {
    switch (this.geometry.type) {
      case "disc":
        const dist2 = Vector2.sqr_distance(this.pos, point);
        if (dist2 < this.geometry.radius * this.geometry.radius) return true;
        else return false;
        break;
      case "rect":
        for (let i = 0; i < this.geometry.world_vertices.length; i++) {
          const a1 = this.geometry.world_vertices[i];
          const a2 =
            i == this.geometry.world_vertices.length - 1
              ? this.geometry.world_vertices[0]
              : this.geometry.world_vertices[i + 1];
          const dir = Vector2.sub(a2, a1);
          const dir_T = new Vector2(-dir.y, dir.x);
          const dot = dir_T.dot(Vector2.sub(point, a1));
          if (dot > 0.0) return false;
        }

        return true;
        break;
    }
  }

  render() {
    if (this.geometry.type == "disc") {
      Render.c.fillStyle = this.color;
      Render.c.strokeStyle = Colors.body_outlines;
      Render.c.lineWidth = Units.mult_s2c * LineWidths.bodies;
      Render.arc(this.pos, this.geometry.radius, true, true);

      const rot_radius = this.geometry.radius / 8;
      const r_world = this.localToWorld(
        new Vector2((3 * this.geometry.radius) / 4, 0),
      );
      Render.c.fillStyle = Colors.outlines;
      Render.arc(r_world, rot_radius, true, true);
    } else if (this.geometry.type == "rect") {
      this.geometry.world_vertices = [];
      for (let i = 0; i < this.geometry.local_vertices.length; i++) {
        this.geometry.world_vertices.push(
          this.localToWorld(this.geometry.local_vertices[i]),
        );
      }

      Render.c.fillStyle = this.color;
      Render.c.strokeStyle = Colors.body_outlines;
      Render.c.lineWidth = Units.mult_s2c * LineWidths.bodies;
      Render.polygon(this.geometry.world_vertices, true, true);
    }
  }

  /**
   * From offset around COM to world-space (sim-space)
   * @param {Body} body
   * @param {Vector2} r Offset in local-space
   * @returns {Vector2}
   */
  localToWorld(r) {
    const rotated_local = Vector2.rotateByAngle(r, this.theta);
    const w = Vector2.add(rotated_local, this.pos);
    return w;
  }

  /**
   * From world-space (sim-space) to offset around COM.
   * @param {Body} body
   * @param {*} Point in world-space (sim-space)
   * @returns {Vector2}
   */
  worldToLocal(w) {
    const rotated_local = Vector2.sub(w, this.pos);
    const r = Vector2.rotateByAngle(rotated_local, -this.theta);
    return r;
  }

  /**
   *
   * @param {Vector2} dir Doesn't have to be of unit-length
   * @returns {Vector2} The point with hightst dot product with dir
   */
  supportPoint(dir) {
    let best = Vector2.zero.clone();
    let best_dist = Number.NEGATIVE_INFINITY;

    const d = dir.normalized();
    switch (this.geometry.type) {
      case "disc":
        return Vector2.add(this.pos, Vector2.scale(this.geometry.radius, d));
      case "rect":
        for (let i = 0; i < this.geometry.world_vertices.length; i++) {
          const rotated_local = Vector2.sub(
            this.geometry.world_vertices[i],
            this.pos,
          );
          const dist = d.dot(rotated_local);
          if (dist > best_dist) {
            best_dist = dist;
            best.set(this.geometry.world_vertices[i]);
          }
        }
        return best;
    }
  }

  /**
   * @param {Body} body
   * @param {Vector2} r
   * @returns {Vector2} The velocity the offset vector r is experiencing
   */
  getLocalVel(r) {
    // |v| = r * omega
    const mag = r.magnitude();
    const n = Vector2.scale(1 / mag, r);
    const dir = new Vector2(-n.x, n.x);
    return Vector2.scale(dir, mag * this.omega);
  }

  toJSON() {
    return {
      pos: this.pos.toJSON(),
      prev_pos: this.prev_pos.toJSON(),
      vel: this.vel.toJSON(),
      force: this.force.toJSON(),
      mass: this.mass,
      theta: this.theta,
      prev_theta: this.prev_theta,
      omega: this.omega,
      tau: this.tau,
      I: this.I,
      color: this.color,
      geometry: {
        type: this.geometry.type,
        radius: this.geometry.radius,
        width: this.geometry.width,
        height: this.geometry.height,
        local_vertices: this.geometry.local_vertices.map((v) => v.toJSON()),
        world_vertices: this.geometry.world_vertices.map((v) => v.toJSON()),
      },
    };
  }

  static fromJSON(data) {
    const pos = Vector2.fromJSON(data.pos);
    const geometry = {
      type: data.geometry.type,
      radius: data.geometry.radius,
      width: data.geometry.width,
      height: data.geometry.height,
      local_vertices: data.geometry.local_vertices.map((v) =>
        Vector2.fromJSON(v),
      ),
      world_vertices: data.geometry.world_vertices.map((v) =>
        Vector2.fromJSON(v),
      ),
    };
    const body = new RigidBody(pos, data.mass, geometry);
    body.prev_pos = Vector2.fromJSON(data.prev_pos);
    body.vel = Vector2.fromJSON(data.vel);
    body.force = Vector2.fromJSON(data.force);
    body.theta = data.theta;
    body.prev_theta = data.prev_theta;
    body.omega = data.omega;
    body.tau = data.tau;
    body.I = data.I;
    body.color = data.color;
    return body;
  }
}
