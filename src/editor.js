import { User } from "./user.js";
import { Vector2 } from "./utils/math.js";
import { RigidBody } from "./rigid_body.js";
import { PhysicsSystem } from "./physics_system.js";
import { Render } from "./utils/render.js";
import {
  Colors,
  LineWidths,
  RenderConstants,
} from "./settings/render_settings.js";
import { Units } from "./utils/units.js";
import { OffsetLinkConstraint, RevoluteJoint } from "./constraints.js";

export const editor = {
  active: false,
  snap_to_grid: false,
  standard: {
    mass: 1,
    radius: 0.1, // disc
    width: 0.5, // rect
    height: 0.25, // rect
  },
  spawning_rigidbody: false,
  spawning_joint: false,
  spawner: {
    typeof_rigidbody: "disc", // also "rect"
    typeof_joint: "link", // also nothing
    constraint_alpha: 0.0,
  },
  preliminary: {
    // the entity that is being spawned
    disc: {
      pos: Vector2.zero.clone(),
      radius: 0,
    },
    rect: {
      origin_pos: Vector2.zero.clone(),
      width: 0,
      height: 0,
    },
    two_body_joint: {
      id1: -1,
      r1: Vector2.zero.clone(),
    },
  },
  recent_entities: [],

  /**
   * @param {PhysicsSystem} psystem
   * @param {Vector2} pos
   * @param {number} mass OPTIONAL
   * @param {number} radius OPTIONAL
   * @param {number} width OPTIONAL
   * @param {number} height OPTIONAL
   */
  spawnRigidBody(psystem, pos, mass, radius, width, height) {
    let body;

    switch (this.spawner.typeof_rigidbody) {
      case "disc":
        body = new RigidBody(pos.clone(), mass ? mass : this.standard.mass, {
          type: "disc",
          radius: radius ? radius : this.standard.radius,
        });
        break;
      case "rect":
        body = new RigidBody(pos.clone(), mass ? mass : this.standard.mass, {
          type: "rect",
          width: width ? width : this.standard.width,
          height: height ? height : this.standard.height,
        });
        break;
    }

    psystem.bodies.push(body);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });
  },

  /**
   * @param {PhysicsSystem} psystem
   * @param {string} type Type of prismatic constraint
   */
  spawnPrismaticJoint(psystem, type, id, r) {
    psystem.addPrismaticJoint(this.spawner.constraint_alpha, type, id, r);
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });
  },

  spawnJoint(psystem, type, id1, id2, r1, r2) {
    switch (type) {
      case "link":
        psystem.addLinkJoint(this.spawner.constraint_alpha, id1, id2, r1, r2);
        this.recent_entities.push({
          type: "constraint",
          id: psystem.constraints.length - 1,
        });
        break;
      case "revolute":
        psystem.addRevoluteJoint(
          this.spawner.constraint_alpha,
          id1,
          id2,
          r1,
          r2,
        );
        this.recent_entities.push({
          type: "constraint",
          id: psystem.constraints.length - 1,
        });
        break;
      case "spring":
        psystem.addSpringJoint(id1, id2, r1, r2);
        this.recent_entities.push({
          type: "force generator",
          id: psystem.force_generators.length - 1,
        });
        break;
    }
  },

  spawnRagdoll(psystem, pos = null) {
    const id_off = psystem.bodies.length;

    const alpha = 0.0;

    const ol = 0.03; // overlapp

    const headpos = (
      this.snap_to_grid ? User.mouse.grid_sim_pos : User.mouse.sim_pos
    ).clone();
    if (pos) {
      headpos.set(pos);
    }
    const r_head = 0.2;
    const neck = 0.08;

    const th = 0.7;
    const tw = 0.4;
    const tpos = Vector2.add(headpos, new Vector2(0, -r_head - neck - th / 2));

    const lw = 0.15;
    const lh = 0.8;
    const l1pos = Vector2.add(
      tpos,
      new Vector2(-tw / 2 + lw / 2, -th / 2 - lh / 2 + ol),
    );
    const l2pos = Vector2.add(
      tpos,
      new Vector2(tw / 2 - lw / 2, -th / 2 - lh / 2 + ol),
    );

    const aw = 0.6;
    const ah = 0.12;
    const a1pos = Vector2.add(
      tpos,
      new Vector2(-tw / 2 - aw / 2 + ol, th / 2 - ah / 2),
    );
    const a2pos = Vector2.add(
      tpos,
      new Vector2(tw / 2 + aw / 2 - ol, th / 2 - ah / 2),
    );

    const head = new RigidBody(headpos, 1, { type: "disc", radius: r_head });
    const torso = new RigidBody(tpos, 1, {
      type: "rect",
      width: tw,
      height: th,
    });
    const leg1 = new RigidBody(l1pos, 1, {
      type: "rect",
      width: lw,
      height: lh,
    });
    const leg2 = new RigidBody(l2pos, 1, {
      type: "rect",
      width: lw,
      height: lh,
    });
    const arm1 = new RigidBody(a1pos, 1, {
      type: "rect",
      width: aw,
      height: ah,
    });
    const arm2 = new RigidBody(a2pos, 1, {
      type: "rect",
      width: aw,
      height: ah,
    });

    psystem.bodies.push(head);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });
    psystem.bodies.push(torso);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });
    psystem.bodies.push(leg1);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });
    psystem.bodies.push(leg2);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });
    psystem.bodies.push(arm1);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });
    psystem.bodies.push(arm2);
    this.recent_entities.push({
      type: "rigidbody",
      id: psystem.bodies.length - 1,
    });

    const rev_t_l1_p = Vector2.add(l1pos, new Vector2(0, lh / 2 - ol / 2));
    const rev_torso_leg1 = new RevoluteJoint(
      alpha,
      id_off + 1,
      id_off + 2,
      torso.worldToLocal(rev_t_l1_p),
      leg1.worldToLocal(rev_t_l1_p),
    );

    const rev_t_l2_p = Vector2.add(l2pos, new Vector2(0, lh / 2 - ol / 2));
    const rev_torso_leg2 = new RevoluteJoint(
      alpha,
      id_off + 1,
      id_off + 3,
      torso.worldToLocal(rev_t_l2_p),
      leg2.worldToLocal(rev_t_l2_p),
    );

    const rev_t_a1_p = Vector2.add(a1pos, new Vector2(aw / 2 - ol / 2, 0));
    const rev_torso_arm1 = new RevoluteJoint(
      alpha,
      id_off + 1,
      id_off + 4,
      torso.worldToLocal(rev_t_a1_p),
      arm1.worldToLocal(rev_t_a1_p),
    );

    const rev_t_a2_p = Vector2.add(a2pos, new Vector2(-aw / 2 + ol / 2, 0));
    const rev_torso_arm2 = new RevoluteJoint(
      alpha,
      id_off + 1,
      id_off + 5,
      torso.worldToLocal(rev_t_a2_p),
      arm2.worldToLocal(rev_t_a2_p),
    );

    psystem.constraints.push(rev_torso_leg1);
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });
    psystem.constraints.push(rev_torso_leg2);
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });
    psystem.constraints.push(rev_torso_arm1);
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });
    psystem.constraints.push(rev_torso_arm2);
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });

    const link_t_head_p1 = Vector2.add(
      tpos,
      new Vector2(-r_head / 2, th / 2 - ol / 2),
    );
    const link_t_head_p2 = Vector2.add(
      headpos,
      new Vector2(-r_head / 4, -r_head / 4),
    );
    const link_t_head_p3 = Vector2.add(
      headpos,
      new Vector2(r_head / 4, -r_head / 4),
    );
    const link_t_head_p4 = Vector2.add(
      tpos,
      new Vector2(r_head / 2, th / 2 - ol / 2),
    );
    psystem.addLinkJoint(
      alpha,
      id_off + 1,
      id_off,
      torso.worldToLocal(link_t_head_p1),
      head.worldToLocal(link_t_head_p2),
    );
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });
    psystem.addLinkJoint(
      alpha,
      id_off + 1,
      id_off,
      torso.worldToLocal(link_t_head_p4),
      head.worldToLocal(link_t_head_p3),
    );
    this.recent_entities.push({
      type: "constraint",
      id: psystem.constraints.length - 1,
    });
  },

  removeMostRecentEntity(psystem) {
    if (this.recent_entities.length == 0) return;

    const recent = this.recent_entities.pop();
    if (recent.type == "rigidbody") psystem.bodies.splice(recent.id, 1);
    else if (recent.type == "force generator")
      psystem.force_generators.splice(recent.id, 1);
    else if (recent.type == "constraint")
      psystem.constraints.splice(recent.id, 1);
  },

  update() {
    const pos = this.snap_to_grid
      ? User.mouse.grid_sim_pos
      : User.mouse.sim_pos;
    if (this.spawning_rigidbody) {
      switch (this.spawner.typeof_rigidbody) {
        case "disc":
          this.preliminary.disc.radius = Vector2.distance(
            this.preliminary.disc.pos,
            pos,
          );
          break;
        case "rect":
          this.preliminary.rect.width =
            pos.x - this.preliminary.rect.origin_pos.x;
          this.preliminary.rect.height =
            pos.y - this.preliminary.rect.origin_pos.y;
          break;
      }
    }
  },

  render(psystem) {
    Render.c.lineWidth = LineWidths.hologramic_outline * Units.mult_s2c;
    Render.c.fillStyle = Colors.hologramic_spawning;
    Render.c.strokeStyle = Colors.hologramic_spawning_outline;
    if (this.spawning_rigidbody) {
      switch (this.spawner.typeof_rigidbody) {
        case "disc":
          const disc_pos = this.preliminary.disc.pos;
          const rad = this.preliminary.disc.radius;
          Render.arc(disc_pos, rad, true, true);
          break;
        case "rect":
          const rect_pos = this.preliminary.rect.origin_pos;
          const width = this.preliminary.rect.width;
          const height = this.preliminary.rect.height;
          Render.rect(rect_pos, new Vector2(width, height), true, true);
          break;
      }
    }
    if (this.spawning_joint) {
      const m_pos = this.snap_to_grid
        ? User.mouse.grid_sim_pos
        : User.mouse.sim_pos;
      switch (this.spawner.typeof_joint) {
        case "link":
          const link_pos_1 = psystem.bodies[
            this.preliminary.two_body_joint.id1
          ].localToWorld(this.preliminary.two_body_joint.r1);
          Render.line(link_pos_1, m_pos);
          break;
        case "spring":
          const spring_pos_1 = psystem.bodies[
            this.preliminary.two_body_joint.id1
          ].localToWorld(this.preliminary.two_body_joint.r1);
          Render.line(spring_pos_1, m_pos);
          break;
      }
    }
  },
};
