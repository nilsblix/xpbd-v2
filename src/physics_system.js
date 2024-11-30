import { Vector2 } from "./utils/math.js";
import { Render } from "./utils/render.js";
import { Units } from "./utils/units.js";

import { User } from "./user.js";
import {
  Gravity,
  EnergyDamping,
  MouseSpring,
  SpringJoint,
} from "./force_generators.js";

import {
  OffsetLinkConstraint,
  PrismaticYConstraint,
  PrismaticPosConstraint,
  RevoluteJoint,
} from "./constraints.js";
import { RigidBody } from "./rigid_body.js";

export class PhysicsSystem {
  static EPS = 1e-8;

  static sub_steps = 10;
  static dt = 1 / 120;
  static pdt = -1;
  static rdt = -1;
  static energy = 0;
  static c_eval = 0;

  static simulating = false;

  // constants
  static GRAVITY = 9.82;
  static ENERGY_DAMP_MU = 0e-1;
  static SPRING_JOINT_STIFFNESS = 20;
  static MOUSESPRING_JOINT_STIFFNESS = 20;

  // static objects
  static mouse_spring = new MouseSpring();
  static ACTIVATE_MOUSE_SPRING = false;

  constructor() {
    this.bodies = [];
    this.force_generators = [];
    this.constraints = [];

    this.force_generators.push(new Gravity());
    this.force_generators.push(new EnergyDamping());
  }

  set(copy) {
    this.bodies = copy.bodies;
    this.force_generators = copy.force_generators;
    this.constraints = copy.constraints;
  }

  toJSON() {
    return JSON.stringify({
      bodies: this.bodies.map((body) => body.toJSON()),
      constraints: this.constraints.map((con) => {
        if (con.toJSON) {
          return { type: con.constructor.name, ...con.toJSON() }; // Stateful
        } else {
          throw new Error(`Unknown constraint: ${con.constructor.name}`);
        }
      }),
      force_generators: this.force_generators.map((fg) => {
        if (fg instanceof Gravity) {
          return { type: "Gravity" }; // Stateless
        } else if (fg instanceof EnergyDamping) {
          return { type: "EnergyDamping" }; // Stateless
        } else if (fg.toJSON) {
          return { type: "fg.constructor.name", ...fg.toJSON() }; // Stateful
        } else {
          throw new Error(`Unknown force generator: ${fg.constructor.name}`);
        }
      }),
    });
  }

  static fromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    const system = new PhysicsSystem();
    for (let body_data of data.bodies) {
      system.bodies.push(RigidBody.fromJSON(body_data));
    }
    for (let fgen_data of data.force_generators) {
      if (fgen_data.type == "SpringJoint")
        system.force_generators.push(SpringJoint.fromJSON(fgen_data));
    }
    for (let con_data of data.constraints) {
      if (con_data.type == "OffsetLinkConstraint")
        system.constraints.push(OffsetLinkConstraint.fromJSON(con_data));
      else if (con_data.type == "PrismaticYConstraint")
        system.constraints.push(PrismaticYConstraint.fromJSON(con_data));
      else if (con_data.type == "PrismaticPosConstraint")
        system.constraints.push(PrismaticPosConstraint.fromJSON(con_data));
      else if (con_data.type == "RevoluteJoint")
        system.constraints.push(RevoluteJoint.fromJSON(con_data));
    }
    return system;
  }

  handleMouseSpring() {
    if (PhysicsSystem.ACTIVATE_MOUSE_SPRING && !PhysicsSystem.mouse_spring.active) {
      for (let i = 0; i < this.bodies.length; i++) {
        if (PhysicsSystem.mouse_spring.bodyIsValid(this.bodies[i], i)) {
          PhysicsSystem.mouse_spring.active = true;
        }
      }
    }

    if (!PhysicsSystem.ACTIVATE_MOUSE_SPRING && PhysicsSystem.mouse_spring.active) {
      PhysicsSystem.mouse_spring.active = false;
    }

    if (PhysicsSystem.mouse_spring.id == -1) {
      PhysicsSystem.mouse_spring.active = false;
    }
  }

  process() {
    this.handleMouseSpring();

    if (!PhysicsSystem.simulating) return;

    const sub_dt =
      PhysicsSystem.dt / PhysicsSystem.sub_steps;

    for (let s = 0; s < PhysicsSystem.sub_steps; s++) {
      // forces
      for (let i = 0; i < this.force_generators.length; i++) {
        this.force_generators[i].apply(this.bodies);
      }

      if (PhysicsSystem.mouse_spring.active)
        PhysicsSystem.mouse_spring.apply(this.bodies);

      // integrate
      for (let i = 0; i < this.bodies.length; i++) {
        const a = this.bodies[i];

        a.prev_pos.set(a.pos);
        a.prev_theta = a.theta;

        // linear integration
        const acc = Vector2.scale(1 / a.mass, a.force);
        a.vel = Vector2.add(a.vel, Vector2.scale(sub_dt, acc));
        a.pos = Vector2.add(a.pos, Vector2.scale(sub_dt, a.vel));
        a.force.set(new Vector2(0, 0));

        // angular integration
        const alpha = a.tau / a.I;
        a.omega += alpha * sub_dt;
        a.theta += a.omega * sub_dt;
        a.tau = 0;
      }

      // solve constraints
      for (let i = 0; i < this.constraints.length; i++) {
        this.constraints[i].solve(this.bodies);
      }

      // update velocities
      for (let i = 0; i < this.bodies.length; i++) {
        const a = this.bodies[i];

        a.vel.set(Vector2.scale(1 / sub_dt, Vector2.sub(a.pos, a.prev_pos)));
        a.omega = (a.theta - a.prev_theta) / sub_dt;
      }
    }
  }

  render() {
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].render(false);
    }

    for (let i = 0; i < this.constraints.length; i++) {
      this.constraints[i].render(this.bodies);
    }

    for (let i = 0; i < this.force_generators.length; i++) {
      this.force_generators[i].render(this.bodies);
    }

    if (PhysicsSystem.mouse_spring.active)
      PhysicsSystem.mouse_spring.render(this.bodies);
  }

  getSystemEnergy() {
    let E = 0;
    for (let i = 0; i < this.force_generators.length; i++) {
      E += this.force_generators[i].getWorkStored(this.bodies);
    }

    for (let i = 0; i < this.bodies.length; i++) {
      E += this.bodies[i].getKineticEnergy();
    }

    if (PhysicsSystem.mouse_spring.active)
      E += PhysicsSystem.mouse_spring.getWorkStored(this.bodies);

    return E;
  }

  addSpringJoint(id1, id2, r1, r2) {
    this.force_generators.push(new SpringJoint(id1, r1, id2, r2));
  }

  /**
   * @param {number} alpha Compliance
   * @param {number} id1
   * @param {number} id2
   * @param {Vector2} r1
   * @param {Vector2} r2
   */
  addLinkJoint(alpha, id1, id2, r1, r2) {
    this.constraints.push(
      new OffsetLinkConstraint(
        alpha,
        id1,
        id2,
        r1,
        r2,
        Vector2.distance(
          Vector2.add(this.bodies[id1].pos, r1),
          Vector2.add(this.bodies[id2].pos, r2),
        ),
      ),
    );
  }

  /**
   * @param {number} alpha
   * @param {string} type y...
   * @param {number} id
   * @param {Vector2} r
   */
  addPrismaticJoint(alpha, type, id, r) {
    switch (type) {
      case "y":
        this.constraints.push(
          new PrismaticYConstraint(alpha, id, r, this.bodies[id].pos.y + r.y),
        );
        break;
      case "pos":
        this.constraints.push(
          new PrismaticPosConstraint(
            alpha,
            id,
            r,
            Vector2.add(this.bodies[id].pos, r),
          ),
        );
        break;
    }
  }

  addRevoluteJoint(alpha, id1, id2, r1, r2) {
    this.constraints.push(new RevoluteJoint(alpha, id1, id2, r1, r2));
  }

  /**
   * If se
   * @param {Vector2} point
   * @param {boolean} search_through_bodies If it searches through bodies underneatch current one
   * @returns {{id: number, body: RigidBody}} If not found, returns "false"
   */
  getRigidBodyInfoContainingPoint(point, search_through_bodies = false) {
    const infos = [];
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const body = this.bodies[i];
      if (body.pointIsInside(point)) {
        infos.push({ id: i, body: body });
        if (!search_through_bodies || infos.length == 2) return infos;
      }
    }

    if (search_through_bodies && infos.length > 0) {
      return infos;
    }

    return false;
  }

  /**
   *
   * @returns {boolean} Is the system populated or not
   */
  isDefault() {
    return this.bodies.length === 0 && this.constraints.length === 0;
  }

  /**
   *
   * @returns {number} Sum of squares of individual constraints C
   */
  getSumOfConstraints() {
    let C = 0;
    for (let i = 0; i < this.constraints.length; i++) {
      C += this.constraints[i].C ** 2;
    }
    return Math.sqrt(C);
  }
}
