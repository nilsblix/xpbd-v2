import { Units } from "./utils/units.js";
import { Render } from "./utils/render.js";
import { ScopedTimer, FPSCalculator } from "./utils/scoped_timer.js";
import { Vector2 } from "./utils/math.js";

import {
  Colors,
  LineWidths,
  RenderConstants,
} from "./settings/render_settings.js";

import { PhysicsSystem } from "./physics_system.js";

import { User } from "./user.js";

import { updateGUI } from "./gui/gui_helper.js";
import { initGUIWindows } from "./gui/gui_helper.js";

import { setupScene } from "./demo_scenes.js";

import { editor } from "./editor.js";

export var psystem;

const physics_timer = new ScopedTimer(true, 5);
const render_timer = new ScopedTimer(true, 5);
const fps_calculator = new FPSCalculator();

export function start(canvas) {
  psystem = new PhysicsSystem();
  handleEventsOnInput();
  initGUIWindows(psystem);
  User.init();
  User.initMouseEventListeners(canvas);
}

export function update(canvas) {
  Units.init(canvas);

  updateGUI(canvas, psystem);
  fps_calculator.update();

  if (!document.hasFocus()) {
    PhysicsSystem.simulating = false;
    const paused = document.getElementById("paused");
    paused.style.display = "block";
  }

  editor.update();

  PhysicsSystem.dt = fps_calculator.dt;

  render_timer.measure(() => {
    Render.c.clearRect(0, 0, canvas.width, canvas.height);
    Render.renderBackground();
    psystem.render();
    if (editor.active) {
      editor.render(psystem);
    }

    const mouse_pos =
      editor.snap_to_grid && editor.active
        ? User.mouse.grid_sim_pos
        : User.mouse.sim_pos;
    Render.c.fillStyle = Colors.editor_mouse;
    Render.c.strokeStyle = "#000000";
    Render.c.lineWidth = 1;
    Render.arc(mouse_pos, Units.mult_c2s * 6, true, true);

    Render.c.lineWidth = Math.max(0.5, 0.01 * Units.mult_s2c);
    Render.c.strokeStyle = Colors.debug.green;
    Render.rect(Vector2.zero.clone(), Units.DIMS, true, false);

  });
  PhysicsSystem.rdt = render_timer.dt;

  physics_timer.measure(() => psystem.process());
  PhysicsSystem.pdt = physics_timer.dt;

  PhysicsSystem.energy = psystem.getSystemEnergy();
  PhysicsSystem.c_eval = psystem.getSumOfConstraints();

  requestAnimationFrame(() => update(canvas));
}

function handleEventsOnInput() {
  User.handleKeyboardInputs([
    {
      key: " ",
      onkeydown: (e) => {
        e.preventDefault();

        if (editor.active) return;
        PhysicsSystem.simulating = !PhysicsSystem.simulating;

        const paused = document.getElementById("paused");
        if (paused.style.display == "block") paused.style.display = "none";
        else if (paused.style.display == "none") paused.style.display = "block";
      },
      onkeyup: null,
    },
    {
      key: "R",
      onkeydown: (e) => {
        PhysicsSystem.simulating = false;
        psystem = new PhysicsSystem();
        const paused = document.getElementById("paused");
        paused.style.display = "block";
      },
      onkeyup: null,
    },
    {
      key: "1",
      onkeydown: (e) => {
        if (editor.active) {
          editor.spawner.typeof_joint = "spring";
          document.getElementById("editor-joint-type").innerHTML = "Spring";
          return;
        }
        if (!psystem.isDefault()) return;
        PhysicsSystem.simulating = false;
        psystem = new PhysicsSystem();
        const paused = document.getElementById("paused");
        paused.style.display = "block";

        setupScene("test 1", psystem);
      },
      onkeyup: null,
    },
    {
      key: "2",
      onkeydown: (e) => {
        if (editor.active) {
          editor.spawner.typeof_joint = "link";
          document.getElementById("editor-joint-type").innerHTML = "Link";
          return;
        }
        if (!psystem.isDefault()) return;
        PhysicsSystem.simulating = false;
        psystem = new PhysicsSystem();
        const paused = document.getElementById("paused");
        paused.style.display = "block";

        setupScene("test 2", psystem);
      },
      onkeyup: null,
    },
    {
      key: "3",
      onkeydown: (e) => {
        if (editor.active) {
          editor.spawner.typeof_joint = "prismatic-y";
          document.getElementById("editor-joint-type").innerHTML =
            "Prismatic-Y";
          return;
        }
        if (!psystem.isDefault()) return;
        PhysicsSystem.simulating = false;
        psystem = new PhysicsSystem();
        const paused = document.getElementById("paused");
        paused.style.display = "block";

        setupScene("soft square chain", psystem);
      },
      onkeyup: null,
    },
    {
      key: "4",
      onkeydown: (e) => {
        if (editor.active) {
          editor.spawner.typeof_joint = "prismatic-pos";
          document.getElementById("editor-joint-type").innerHTML =
            "Prismatic-Pos";
          return;
        }
      },
      onkeyup: null,
    },
    {
      key: "5",
      onkeydown: (e) => {
        if (editor.active) {
          editor.spawner.typeof_joint = "revolute";
          document.getElementById("editor-joint-type").innerHTML = "Revolute";
          return;
        }
      },
      onkeyup: null,
    },
    {
      key: "0",
      onkeydown: (e) => {
        document.getElementById("settings-gravity-slider").value = 0.0;
        document.getElementById("settings-gravity-value").innerHTML = 0.0;
      },
      onkeyup: null,
    },
    {
      key: "x",
      onkeydown: (e) => {
        editor.spawning_rigidbody = false;
        editor.spawning_joint = false;
      },
      onkeyup: null,
    },
    {
      key: "g",
      onkeydown: (e) => {
        if (!editor.active) return;
        editor.snap_to_grid = !editor.snap_to_grid;
      },
      onkeyup: null,
    },
    {
      key: "E",
      onkeydown: (e) => {
        if (editor.active) {
          editor.active = false;
          document.getElementById("editor-active").innerHTML = "FALSE";
          document.getElementById("paused").innerText = "*paused";
          Colors.editor_mouse = "#f55742";
        } else {
          editor.active = true;
          PhysicsSystem.simulating = false;
          document.getElementById("editor-active").innerHTML = "TRUE";
          document.getElementById("paused").style.display = "block";
          document.getElementById("paused").innerText =
            "*paused (EDITOR ACTIVE)";
          Colors.editor_mouse = "#7af57a";
        }
      },
      onkeyup: null,
    },
    {
      key: "s",
      onkeydown: (e) => {
        if (!editor.active) return;
        if (editor.spawning_rigidbody) return;

        editor.spawning_rigidbody = true;

        const m_pos = editor.snap_to_grid
          ? User.mouse.grid_sim_pos
          : User.mouse.sim_pos;
        switch (editor.spawner.typeof_rigidbody) {
          case "disc":
            editor.preliminary.disc.pos.set(m_pos);
            break;
          case "rect":
            editor.preliminary.rect.origin_pos.set(m_pos);
            break;
        }
      },
      onkeyup: (e) => {
        if (!editor.active) {
          editor.spawning_rigidbody = false;
          return;
        }

        if (!editor.spawning_rigidbody) return;

        switch (editor.spawner.typeof_rigidbody) {
          case "disc":
            editor.spawnRigidBody(
              psystem,
              editor.preliminary.disc.pos,
              editor.standard.mass,
              editor.preliminary.disc.radius,
            );
            break;
          case "rect":
            const rect_pos = editor.preliminary.rect.origin_pos.clone();
            const width = editor.preliminary.rect.width;
            const height = editor.preliminary.rect.height;
            rect_pos.set(
              Vector2.add(
                rect_pos,
                Vector2.scale(1 / 2, new Vector2(width, height)),
              ),
            );
            editor.preliminary.rect.width = Math.abs(width);
            editor.preliminary.rect.height = Math.abs(height);
            editor.spawnRigidBody(
              psystem,
              rect_pos,
              editor.standard.mass,
              null,
              editor.preliminary.rect.width,
              editor.preliminary.rect.height,
            );
            break;
        }
        editor.spawning_rigidbody = false;
      },
    },
    {
      key: "c",
      onkeydown: (e) => {
        if (!editor.active) return;
        if (editor.spawning_joint) return;

        const m_pos = editor.snap_to_grid
          ? User.mouse.grid_sim_pos
          : User.mouse.sim_pos;
        const info = psystem.getRigidBodyInfoContainingPoint(m_pos, true);
        if (!info) return;

        const r = psystem.bodies[info[0].id].worldToLocal(m_pos);
        let r2 = Vector2.zero.clone();
        if (info.length > 1)
          r2.set(psystem.bodies[info[1].id].worldToLocal(m_pos));

        switch (editor.spawner.typeof_joint) {
          case "link":
            editor.preliminary.two_body_joint.id1 = info[0].id;
            editor.preliminary.two_body_joint.r1 = r;
            break;
          case "prismatic-y":
            editor.spawnPrismaticJoint(psystem, "y", info[0].id, r);
            break;
          case "prismatic-pos":
            editor.spawnPrismaticJoint(psystem, "pos", info[0].id, r);
          case "revolute":
            if (info.length <= 1) return;
            editor.spawnJoint(
              psystem,
              "revolute",
              info[0].id,
              info[1].id,
              r,
              r2,
            );
            break;
          case "spring":
            editor.preliminary.two_body_joint.id1 = info[0].id;
            editor.preliminary.two_body_joint.r1 = r;
            break;
        }

        editor.spawning_joint = true;
      },
      onkeyup: (e) => {
        if (!editor.active) {
          editor.spawning_joint = false;
          return;
        }

        if (!editor.spawning_joint) return;
        editor.spawning_joint = false;

        const m_pos = editor.snap_to_grid
          ? User.mouse.grid_sim_pos
          : User.mouse.sim_pos;
        const info = psystem.getRigidBodyInfoContainingPoint(m_pos, true);
        if (!info) return;
        const id1 = editor.preliminary.two_body_joint.id1;
        const r1 = editor.preliminary.two_body_joint.r1;
        const id2 = info[0].id;
        const r2 = psystem.bodies[info[0].id].worldToLocal(m_pos);

        switch (editor.spawner.typeof_joint) {
          case "link":
            editor.spawnJoint(psystem, "link", id1, id2, r1, r2);
            break;
          case "spring":
            editor.spawnJoint(psystem, "spring", id1, id2, r1, r2);
            break;
        }
      },
    },
    {
      key: "H",
      onkeydown: (e) => {
        if (!editor.active) return;
        editor.spawnRagdoll(psystem);
      },
      onkeyup: null,
    },
    {
      key: "Backspace",
      onkeydown: (e) => {
        if (!editor.active) return;
        editor.removeMostRecentEntity(psystem);
      },
      onkeyup: null,
    },
    {
      key: "P",
      onkeydown: (e) => {
        console.log("'" + psystem.toJSON() + "'");
      },
      onkeyup: null,
    },
    {
      key: "v",
      onkeydown: (e) => {
        if (editor.active) return;
        PhysicsSystem.ACTIVATE_MOUSE_SPRING = true;
      },
      onkeyup: (e) => {
        PhysicsSystem.ACTIVATE_MOUSE_SPRING = false;
      },
    },
  ]);
}
