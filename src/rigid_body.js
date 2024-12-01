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

      // this.geometry.local_vertices = [
      //   new Vector2(-geometry.width / 2, -geometry.height / 2),
      //   new Vector2(-geometry.width / 2, geometry.height / 2),
      //   new Vector2(geometry.width / 2, geometry.height / 2),
      //   new Vector2(geometry.width / 2, -geometry.height / 2),
      // ];
      this.geometry.local_vertices = [
        new Vector2(-geometry.width / 2, -geometry.height / 2),
        new Vector2( geometry.width / 2, -geometry.height / 2),
        new Vector2( geometry.width / 2,  geometry.height / 2),
        new Vector2(-geometry.width / 2, geometry.height / 2),
      ]
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
          if (dot < 0.0) return false;
        }

        return true;
        break;
    }
  }

  render(debug) {
    if (debug) {
      switch (this.geometry.type) {
        case "disc":
          Render.c.fillStyle = Colors.debug.dark_green + "99";
          Render.c.strokeStyle = Colors.debug.green;
          Render.c.lineWidth = Units.mult_s2c * LineWidths.bodies;
          Render.arc(this.pos, this.geometry.radius, true, true);

          const end = this.localToWorld(Vector2.scale(this.geometry.radius, Vector2.right.clone().rotateByAngle(this.theta)));
          Render.line(this.pos, end);
          break;
        case "rect":
          this.geometry.world_vertices = [];
          for (let i = 0; i < this.geometry.local_vertices.length; i++) {
            this.geometry.world_vertices.push(
              this.localToWorld(this.geometry.local_vertices[i]),
            );
          }

          Render.c.fillStyle = Colors.debug.dark_green + "99";
          Render.c.strokeStyle = Colors.debug.green;
          Render.c.lineWidth = Units.mult_s2c * LineWidths.bodies;
          Render.polygon(this.geometry.world_vertices, true, true);
          break;
      }
      return;
    }

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
  * @param {RigidBody} body Only usable if this.type == disc
  * @param {Vector2} dir
  * @returns {{v1: Vector2, v2: Vector2}} The edge that with the largest dot product with its normal and dir
  */
  getEdgeWithHighestDot(body, dir) {
    const edges = this.getEdges(body);
    let best_edge = {v1: Vector2.zero.clone(), v2: Vector2.zero.clone()};
    let max_dot = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < edges.length; i++) {
      const getNormal = (body, edge) => {
        const v = Vector2.sub(edge.v2, edge.v1).normalized();
        const normal = new Vector2(-v.x, v.y);
        if (normal.dot(Vector2.sub(body.pos, edge.v1)) < 0.0)
          normal.negate();
        return normal;
      }

      const normal = getNormal(this, edges[i]);
      const dot = normal.dot(dir)
      if (dot > max_dot) {
        max_dot = dot;
        best_edge = edges[i];
      }
    }

    return best_edge;

  }

  /**
  *
  * @param {Vector2} pos
  * @returns {Vector2} The vertex (or disc position) that is closest to input position
  */
  getClosestVertex(pos) {
    switch (this.geometry.type) {
      case "disc":
        // const n = Vector2.sub(pos, this.pos).normalized();
        // return Vector2.add(this.pos, Vector2.scale(this.geometry.radius, n));
        return this.pos;
      case "rect":
        const verts = this.geometry.world_vertices;
        let min_dist = Number.POSITIVE_INFINITY;
        let best_pos = Vector2.zero.clone();
        for (let i = 0; i < verts.length; i++) {
          const dist2 = Vector2.sqr_distance(pos, verts[i]);
          if (dist2 < min_dist) {
            min_dist = dist2;
            best_pos = verts[i];
          }
        }
        return best_pos;
    }
  }

  /**
  * The body input is only useful is this rigidbody is a disc as the SAT edges is dependant on the other position
  * A disc has unlimited edges so it is useful to not have an infinitely large array
  * @param {RigidBody} body2
  * @returns {[{v1: Vector2, v2: Vector2}]} Object ==> {v1: Vector2, v2: Vector2}
  */
  getEdges(body2) {
    const edges = [];
    switch (this.geometry.type) {
      case "disc":
        const p1 = body2.getClosestVertex(this.pos);
        const v = Vector2.sub(p1, this.pos).normalized();
        const p_prime = Vector2.add(this.pos, Vector2.scale(this.geometry.radius, v));
        const tang = Vector2.scale(1E-8, new Vector2(v.y, -v.x));
        const q1 = Vector2.add(p_prime, tang);
        const q2 = Vector2.sub(p_prime, tang);
        edges.push({ v1: q1, v2: q2 });
        break;
      case "rect":
        const verts = this.geometry.world_vertices;
        for (let i = 0; i < verts.length; i++) {
          const a1 = verts[i];
          const a2 = i == verts.length - 1 ? verts[0] : verts[i + 1];
          edges.push({ v1: a1, v2: a2 });
        }
        break;
    }
    return edges;
  }

  /**
  *
  * @param {Vector2} dir Normalized Vector2
  * @returns {{low: Vector2, high: Vector2}} The lowest and highest projected values along this direction
  */
  projectAlongDir(dir) {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    switch(this.geometry.type) {
      case "disc":
        const dot = this.pos.dot(dir);
        const proj1 = dot - this.geometry.radius;
        const proj2 = dot + this.geometry.radius;
        if (proj1 < low)
          low = proj1;
        if (proj2 > high)
          high = proj2;
        break;
      case "rect":
        const verts = this.geometry.world_vertices;
        for (let i = 0; i < verts.length; i++) {
          const proj = verts[i].dot(dir);
          if (proj < low)
            low = proj;
          if (proj > high)
            high = proj;
        }
        break;
    }
    return { low: low, high: high };
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
