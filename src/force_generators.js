/*
    Each force generators has to have these methods
    --> apply(bodies)
        Applies the force to some or all bodies
    --> getWorkStored(bodies)
        Returns the work stored in the transforms of the bodies
    --> render(bodies)
        Doesn't need to do anything.
*/

import { Vector2 } from "./utils/math.js";
import { PhysicsSystem } from "./physics_system.js";
import { Units } from "./utils/units.js";
import { Render } from "./utils/render.js";
import { User } from "./user.js";
import {
  Colors,
  LineWidths,
  RenderConstants,
} from "./settings/render_settings.js";

export class Gravity {
  apply(bodies) {
    const g = Vector2.scale(PhysicsSystem.GRAVITY, Vector2.down);
    for (let i = 0; i < bodies.length; i++) {
      // bodies[i].force.add(Vector2.scale(bodies[i].mass, g));
      bodies[i].force = Vector2.add(
        bodies[i].force,
        Vector2.scale(bodies[i].mass, g),
      );
    }
  }

  getWorkStored(bodies) {
    let E = 0;
    for (let i = 0; i < bodies.length; i++) {
      E += bodies[i].pos.y * bodies[i].mass * PhysicsSystem.GRAVITY;
    }
    return E;
  }

  render(bodies) {}
}

export class EnergyDamping {
  apply(bodies) {
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].force = Vector2.sub(
        bodies[i].force,
        Vector2.scale(PhysicsSystem.ENERGY_DAMP_MU, bodies[i].vel),
      );
      bodies[i].tau -= 0.1 * PhysicsSystem.ENERGY_DAMP_MU * bodies[i].omega;
    }
  }

  getWorkStored(bodies) {
    return 0;
  }

  render(bodies) {
    return;
  }
}

export class SpringJoint {
  /**
   *
   * @param {number} id1
   * @param {Vector2} r1
   * @param {number} id2
   * @param {Vector2} r2
   */
  constructor(id1, r1, id2, r2) {
    this.id1 = id1;
    this.r1 = r1;
    this.id2 = id2;
    this.r2 = r2;

    this.l0 = 0.05;
  }

  apply(bodies) {
    const b1 = bodies[this.id1];
    const b2 = bodies[this.id2];

    const a1 = b1.localToWorld(this.r1);
    const a2 = b2.localToWorld(this.r2);

    const dist = Vector2.distance(a1, a2);
    const hookes = dist - this.l0;
    const force_value = PhysicsSystem.SPRING_JOINT_STIFFNESS * hookes;

    const force = Vector2.scale((force_value * 1) / dist, Vector2.sub(a2, a1));

    // linear force
    b1.force.set(Vector2.add(b1.force, force));
    b2.force.set(Vector2.sub(b2.force, force));

    b1.tau += Vector2.cross(Vector2.sub(a1, b1.pos), force);
    b2.tau += Vector2.cross(Vector2.sub(a2, b2.pos), Vector2.negate(force));
  }

  getWorkStored(bodies) {
    const b1 = bodies[this.id1];
    const b2 = bodies[this.id2];

    const a1 = b1.localToWorld(this.r1);
    const a2 = b2.localToWorld(this.r2);

    const dist = Vector2.distance(a1, a2);
    const hookes = dist - this.l0;
    return (1 / 2) * PhysicsSystem.SPRING_JOINT_STIFFNESS * hookes * hookes;
  }

  render(bodies) {
    const b1 = bodies[this.id1];
    const b2 = bodies[this.id2];

    const a1 = b1.localToWorld(this.r1);
    const a2 = b2.localToWorld(this.r2);

    const segments = [];

    const dist = Vector2.distance(a1, a2);
    const dir = Vector2.scale(1 / dist, Vector2.sub(a2, a1)); // from a1 to a2
    const dir_T = new Vector2(-dir.y, dir.x); // rotate positive 90 degrees from a1 to a2

    const box_width = RenderConstants.spring_joint_box_width;
    const box_height = RenderConstants.spring_joint_box_height;

    const horizontal_11 = Vector2.add(
      a1,
      Vector2.add(
        Vector2.scale(box_height / 2 + LineWidths.lines_outlines, dir),
        Vector2.scale(2 * box_width, Vector2.negate(dir_T)),
      ),
    );
    const horizontal_12 = Vector2.add(
      a1,
      Vector2.add(
        Vector2.scale(box_height / 2 + LineWidths.lines_outlines, dir),
        Vector2.scale(2 * box_width, dir_T),
      ),
    );

    const horizontal_21 = Vector2.add(
      a2,
      Vector2.add(
        Vector2.scale(
          box_height / 2 + LineWidths.lines_outlines,
          Vector2.negate(dir),
        ),
        Vector2.scale(2 * box_width, dir_T),
      ),
    );
    const horizontal_22 = Vector2.add(
      a2,
      Vector2.add(
        Vector2.scale(
          box_height / 2 + LineWidths.lines_outlines,
          Vector2.negate(dir),
        ),
        Vector2.scale(2 * box_width, Vector2.negate(dir_T)),
      ),
    );

    // ACTUAL SPRING ---------------------------------------------------------------------
    const spring_length = dist - box_height;
    const seg_length = spring_length / RenderConstants.spring_joint_segments;
    const spring_start = Vector2.scale(
      1 / 2,
      Vector2.add(horizontal_11, horizontal_12),
    );
    for (let i = 0; i < RenderConstants.spring_joint_segments; i++) {
      const length_along_dir = seg_length * i;
      const length_along_dirT =
        RenderConstants.spring_joint_spring_width * ((i % 2) - 0.5);
      const A = Vector2.add(spring_start, Vector2.scale(length_along_dir, dir));
      const B = Vector2.scale(length_along_dirT, dir_T);
      segments.push(Vector2.add(A, B));
    }

    // FIRST HALF, AS I WANT THEM TO BE OVERLAYED CORRECTLY
    for (let i = 0; i < RenderConstants.spring_joint_segments; i += 2) {
      const seg_start = segments[i];
      const seg_end =
        i == RenderConstants.spring_joint_segments - 1
          ? horizontal_22
          : segments[i + 1];

      Render.c.lineCap = "round";
      Render.c.strokeStyle = Colors.outlines;
      Render.c.lineWidth =
        (RenderConstants.spring_joint_segment_width +
          2 * LineWidths.lines_outlines) *
        Units.mult_s2c;
      Render.line(seg_start, seg_end);

      Render.c.strokeStyle = Colors.spring_joint;
      Render.c.lineWidth =
        RenderConstants.spring_joint_segment_width * Units.mult_s2c;
      Render.line(seg_start, seg_end);
    }

    // SECOND HALF, AS I WANT THEM TO BE OVERLAYED CORRECTLY
    for (let i = 1; i < RenderConstants.spring_joint_segments; i += 2) {
      const seg_start = segments[i];
      const seg_end =
        i == RenderConstants.spring_joint_segments - 1
          ? horizontal_22
          : segments[i + 1];

      Render.c.lineCap = "round";
      Render.c.strokeStyle = Colors.outlines;
      Render.c.lineWidth =
        (RenderConstants.spring_joint_segment_width +
          2 * LineWidths.lines_outlines) *
        Units.mult_s2c;
      Render.line(seg_start, seg_end);

      Render.c.strokeStyle = Colors.spring_joint;
      Render.c.lineWidth =
        RenderConstants.spring_joint_segment_width * Units.mult_s2c;
      Render.line(seg_start, seg_end);
    }

    // BOX 1 ---------------------------------------------------------------------------------
    // box ==>
    // 2 3
    // 1 4
    const box_11 = Vector2.add(
      Vector2.add(
        Vector2.scale(box_height / 2, dir),
        Vector2.scale(box_width / 2, Vector2.negate(dir_T)),
      ),
      a1,
    );
    const box_12 = Vector2.add(
      box_11,
      Vector2.scale(box_height, Vector2.negate(dir)),
    );
    const box_13 = Vector2.add(box_12, Vector2.scale(box_width, dir_T));
    const box_14 = Vector2.sub(
      box_13,
      Vector2.scale(box_height, Vector2.negate(dir)),
    );

    // BOX 2 ---------------------------------------------------------------------------------
    // box ==>
    // 2 3
    // 1 4
    const box_21 = Vector2.add(
      Vector2.add(
        Vector2.scale(box_height / 2, Vector2.negate(dir)),
        Vector2.scale(box_width / 2, dir_T),
      ),
      a2,
    );
    const box_22 = Vector2.add(box_21, Vector2.scale(box_height, dir));
    const box_23 = Vector2.add(
      box_22,
      Vector2.scale(box_width, Vector2.negate(dir_T)),
    );
    const box_24 = Vector2.sub(box_23, Vector2.scale(box_height, dir));

    Render.c.fillStyle = Colors.spring_joint;
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth = LineWidths.lines_outlines * Units.mult_s2c;

    Render.polygon([box_11, box_12, box_13, box_14], true, true);
    Render.arc(a1, RenderConstants.spring_joint_box_radius, true, false);

    Render.polygon([box_21, box_22, box_23, box_24], true, true);
    Render.arc(a2, RenderConstants.spring_joint_box_radius, true, false);

    // HORIZONTAL LINES --------------------------------------------------------------
    Render.c.lineCap = "round";
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth =
      (LineWidths.spring_joint_horizontal_line +
        2 * LineWidths.lines_outlines) *
      Units.mult_s2c;
    Render.line(horizontal_11, horizontal_12);
    Render.line(horizontal_21, horizontal_22);

    Render.c.strokeStyle = Colors.spring_joint;
    Render.c.lineWidth =
      LineWidths.spring_joint_horizontal_line * Units.mult_s2c;
    Render.line(horizontal_11, horizontal_12);
    Render.line(horizontal_21, horizontal_22);
  }

  toJSON() {
    return {
      id1: this.id1,
      r1: this.r1.toJSON(),
      id2: this.id2,
      r2: this.r2.toJSON(),
      l0: this.l0,
    };
  }

  static fromJSON(data) {
    const r1 = Vector2.fromJSON(data.r1);
    const r2 = Vector2.fromJSON(data.r2);
    const joint = new SpringJoint(data.id1, r1, data.id2, r2);
    return joint;
  }
}

export class MouseSpring {
  constructor() {
    this.active = false;
    this.id = -1;
    this.r = Vector2.zero.clone();
    this.l0 = 0.05;
  }

  /**
   *
   * @param {RigidBody} body
   */
  bodyIsValid(body, body_index) {
    if (body.pointIsInside(User.mouse.sim_pos)) {
      this.id = body_index;
      this.r = body.worldToLocal(User.mouse.sim_pos);
      return true;
    }
    return false;
  }

  apply(bodies) {
    const b = bodies[this.id];

    const a = b.localToWorld(this.r);

    const dist = Vector2.distance(User.mouse.sim_pos, a);
    if (dist == 0) return;
    const hookes = dist - this.l0;
    const force_value = PhysicsSystem.MOUSESPRING_JOINT_STIFFNESS * hookes;

    const n = Vector2.scale(1 / dist, Vector2.sub(User.mouse.sim_pos, a));
    const force = Vector2.scale(force_value, n);

    // apply forces
    b.force.set(Vector2.add(b.force, force));
    b.tau += Vector2.cross(Vector2.sub(a, b.pos), force);
  }

  getWorkStored(bodies) {
    const b = bodies[this.id];

    const a = b.localToWorld(this.r);

    const dist = Vector2.distance(User.mouse.sim_pos, a);
    if (dist == 0) return 0;
    const hookes = dist - this.l0;
    return (
      (1 / 2) * PhysicsSystem.MOUSESPRING_JOINT_STIFFNESS * hookes * hookes
    );
  }

  render(bodies) {
    const b = bodies[this.id];

    const a1 = b.localToWorld(this.r);
    const a2 = User.mouse.sim_pos;

    const segments = [];

    const dist = Vector2.distance(a1, a2);
    const dir = Vector2.scale(1 / dist, Vector2.sub(a2, a1)); // from a1 to a2
    const dir_T = new Vector2(-dir.y, dir.x); // rotate positive 90 degrees from a1 to a2

    const box_width = RenderConstants.spring_joint_box_width;
    const box_height = RenderConstants.spring_joint_box_height;

    const horizontal_11 = Vector2.add(
      a1,
      Vector2.add(
        Vector2.scale(box_height / 2 + LineWidths.lines_outlines, dir),
        Vector2.scale(2 * box_width, Vector2.negate(dir_T)),
      ),
    );
    const horizontal_12 = Vector2.add(
      a1,
      Vector2.add(
        Vector2.scale(box_height / 2 + LineWidths.lines_outlines, dir),
        Vector2.scale(2 * box_width, dir_T),
      ),
    );

    const horizontal_21 = Vector2.add(
      a2,
      Vector2.add(
        Vector2.scale(
          box_height / 2 + LineWidths.lines_outlines,
          Vector2.negate(dir),
        ),
        Vector2.scale(2 * box_width, dir_T),
      ),
    );
    const horizontal_22 = Vector2.add(
      a2,
      Vector2.add(
        Vector2.scale(
          box_height / 2 + LineWidths.lines_outlines,
          Vector2.negate(dir),
        ),
        Vector2.scale(2 * box_width, Vector2.negate(dir_T)),
      ),
    );

    // ACTUAL SPRING ---------------------------------------------------------------------
    const spring_length = dist - box_height;
    const seg_length = spring_length / RenderConstants.spring_joint_segments;
    const spring_start = Vector2.scale(
      1 / 2,
      Vector2.add(horizontal_11, horizontal_12),
    );
    for (let i = 0; i < RenderConstants.spring_joint_segments; i++) {
      const length_along_dir = seg_length * i;
      const length_along_dirT =
        RenderConstants.spring_joint_spring_width * ((i % 2) - 0.5);
      const A = Vector2.add(spring_start, Vector2.scale(length_along_dir, dir));
      const B = Vector2.scale(length_along_dirT, dir_T);
      segments.push(Vector2.add(A, B));
    }

    // FIRST HALF, AS I WANT THEM TO BE OVERLAYED CORRECTLY
    for (let i = 0; i < RenderConstants.spring_joint_segments; i += 2) {
      const seg_start = segments[i];
      const seg_end =
        i == RenderConstants.spring_joint_segments - 1
          ? horizontal_22
          : segments[i + 1];

      Render.c.lineCap = "round";
      Render.c.strokeStyle = Colors.outlines;
      Render.c.lineWidth =
        (RenderConstants.spring_joint_segment_width +
          2 * LineWidths.lines_outlines) *
        Units.mult_s2c;
      Render.line(seg_start, seg_end);

      Render.c.strokeStyle = Colors.spring_joint;
      Render.c.lineWidth =
        RenderConstants.spring_joint_segment_width * Units.mult_s2c;
      Render.line(seg_start, seg_end);
    }

    // SECOND HALF, AS I WANT THEM TO BE OVERLAYED CORRECTLY
    for (let i = 1; i < RenderConstants.spring_joint_segments; i += 2) {
      const seg_start = segments[i];
      const seg_end =
        i == RenderConstants.spring_joint_segments - 1
          ? horizontal_22
          : segments[i + 1];

      Render.c.lineCap = "round";
      Render.c.strokeStyle = Colors.outlines;
      Render.c.lineWidth =
        (RenderConstants.spring_joint_segment_width +
          2 * LineWidths.lines_outlines) *
        Units.mult_s2c;
      Render.line(seg_start, seg_end);

      Render.c.strokeStyle = Colors.spring_joint;
      Render.c.lineWidth =
        RenderConstants.spring_joint_segment_width * Units.mult_s2c;
      Render.line(seg_start, seg_end);
    }

    // BOX 1 ---------------------------------------------------------------------------------
    // box ==>
    // 2 3
    // 1 4
    const box_11 = Vector2.add(
      Vector2.add(
        Vector2.scale(box_height / 2, dir),
        Vector2.scale(box_width / 2, Vector2.negate(dir_T)),
      ),
      a1,
    );
    const box_12 = Vector2.add(
      box_11,
      Vector2.scale(box_height, Vector2.negate(dir)),
    );
    const box_13 = Vector2.add(box_12, Vector2.scale(box_width, dir_T));
    const box_14 = Vector2.sub(
      box_13,
      Vector2.scale(box_height, Vector2.negate(dir)),
    );

    // BOX 2 ---------------------------------------------------------------------------------
    // box ==>
    // 2 3
    // 1 4
    const box_21 = Vector2.add(
      Vector2.add(
        Vector2.scale(box_height / 2, Vector2.negate(dir)),
        Vector2.scale(box_width / 2, dir_T),
      ),
      a2,
    );
    const box_22 = Vector2.add(box_21, Vector2.scale(box_height, dir));
    const box_23 = Vector2.add(
      box_22,
      Vector2.scale(box_width, Vector2.negate(dir_T)),
    );
    const box_24 = Vector2.sub(box_23, Vector2.scale(box_height, dir));

    Render.c.fillStyle = Colors.spring_joint;
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth = LineWidths.lines_outlines * Units.mult_s2c;

    Render.polygon([box_11, box_12, box_13, box_14], true, true);
    Render.arc(a1, RenderConstants.spring_joint_box_radius, true, false);

    Render.polygon([box_21, box_22, box_23, box_24], true, true);
    Render.arc(a2, RenderConstants.spring_joint_box_radius, true, false);

    // HORIZONTAL LINES --------------------------------------------------------------
    Render.c.lineCap = "round";
    Render.c.strokeStyle = Colors.outlines;
    Render.c.lineWidth =
      (LineWidths.spring_joint_horizontal_line +
        2 * LineWidths.lines_outlines) *
      Units.mult_s2c;
    Render.line(horizontal_11, horizontal_12);
    Render.line(horizontal_21, horizontal_22);

    Render.c.strokeStyle = Colors.spring_joint;
    Render.c.lineWidth =
      LineWidths.spring_joint_horizontal_line * Units.mult_s2c;
    Render.line(horizontal_11, horizontal_12);
    Render.line(horizontal_21, horizontal_22);
  }
}
