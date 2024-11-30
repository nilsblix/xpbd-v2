import { PhysicsSystem } from "../physics_system.js";
import { editor } from "../editor.js";
import { User } from "../user.js";
import { RigidBody } from "../rigid_body.js";
import { psystem } from "../engine.js";

class GUIWindow {
  // slider args is in [{slider_id: x, value_id: x, num_decimals: x}, {etc}]
  constructor(toggle_window_key, id_window, id_header, slider_args) {
    this.toggle_key = toggle_window_key;
    this.window = document.getElementById(id_window);
    this.header = document.getElementById(id_header);
    this.slider_args = slider_args;
  }

  static updateSlider(arr) {
    const slider = document.getElementById(arr.slider_id);
    const value = document.getElementById(arr.value_id);
    slider.addEventListener("input", () => {
      value.innerText = parseFloat(slider.value).toFixed(arr.num_decimals);
    });
  }

  init() {
    this.window.style.display = "none";

    for (let i = 0; i < this.slider_args.length; i++) {
      GUIWindow.updateSlider(this.slider_args[i]);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key == this.toggle_key) {
        if (this.window.style.display == "block") {
          this.window.style.display = "none";
        } else if (this.window.style.display == "none") {
          this.window.style.display = "block";
        }
      }
    });

    let dragging = false;
    let off_x = 0;
    let off_y = 0;

    this.header.addEventListener("mousedown", (e) => {
      dragging = true;
      off_x = e.clientX - this.window.offsetLeft;
      off_y = e.clientY - this.window.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (dragging) {
        this.window.style.left = `${e.clientX - off_x}px`;
        this.window.style.top = `${e.clientY - off_y}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
    });
  }
}

const settings = new GUIWindow("q", "settings-window", "settings-header", [
  {
    slider_id: "settings-gravity-slider",
    value_id: "settings-gravity-value",
    num_decimals: "2",
  },
  {
    slider_id: "settings-energy-damping-slider",
    value_id: "settings-energy-damping-value",
    num_decimals: "2",
  },
  {
    slider_id: "settings-spring-stiffness-slider",
    value_id: "settings-spring-stiffness-value",
    num_decimals: "1",
  },
  {
    slider_id: "settings-mouse-spring-stiffness-slider",
    value_id: "settings-mouse-spring-stiffness-value",
    num_decimals: "1",
  },
]);

const profiling = new GUIWindow(
  "a",
  "profiling-window",
  "profiling-header",
  [],
);

const info = new GUIWindow("z", "info-window", "info-header", [
  {
    slider_id: "info-sub-steps-slider",
    value_id: "info-sub-steps-value",
    num_decimals: "0",
  },
]);

const keybinds_window = new GUIWindow(
  "w",
  "keybind-window",
  "keybind-header",
  [],
);

const editor_window = new GUIWindow("e", "editor-window", "editor-header", [
  {
    slider_id: "editor-rigidbody-type-slider",
    value_id: "editor-rigidbody-type-value",
    num_decimals: "0",
  },
  {
    slider_id: "editor-constraint-compliance-slider",
    value_id: "editor-constraint-compliance-value",
    num_decimals: "3",
  },
  {
    slider_id: "editor-rigidbody-mass-slider",
    value_id: "editor-rigidbody-mass-value",
    num_decimals: "1",
  },
]);

export function initGUIWindows() {
  settings.init();
  profiling.init();
  info.init();
  keybinds_window.init();
  editor_window.init();

  initButtons();
}

export function updateGUI(canvas, psystem) {
  // update constant label positions
  const rect = canvas.getBoundingClientRect();
  const popup = document.getElementById("popup-window");
  const top_left_label = document.getElementById("top-left-label");
  const paused = document.getElementById("paused");
  const bottom_left_info = document.getElementById("bottom-left-info");
  popup.style.right = `${window.innerWidth - rect.right}px`;
  popup.style.bottom = `${window.innerHeight - rect.bottom}px`;
  top_left_label.style.left = `${rect.left}px`;
  top_left_label.style.top = `${rect.top}px`;
  paused.style.right = `${window.innerWidth - rect.right}px`;
  paused.style.top = `${rect.top}px`;
  bottom_left_info.style.left = `${rect.left}px`;
  bottom_left_info.style.bottom = `${rect.top}px`;

  updateDisplayedDebugs(psystem);
  updateChangedUserData();
  updatePopupWindow(canvas, psystem);
}

function updateDisplayedDebugs(psystem) {
  document.getElementById("bottom-left-mouse-position").innerHTML = "[" + User.mouse.sim_pos.x.toFixed(4) + ", " + User.mouse.sim_pos.y.toFixed(4) + "]"

  // profiling
  document.getElementById("profiling-dt").innerHTML = (
    PhysicsSystem.dt * 1e3
  ).toFixed(3);
  document.getElementById("profiling-pdt").innerHTML = (
    PhysicsSystem.pdt * 1e3
  ).toFixed(3);
  document.getElementById("profiling-rdt").innerHTML = (
    PhysicsSystem.rdt * 1e3
  ).toFixed(3);
  document.getElementById("profiling-energy").innerHTML =
    PhysicsSystem.energy.toFixed(3);
  document.getElementById("profiling-c-eval").innerHTML = (
    1e6 * PhysicsSystem.c_eval
  ).toFixed(5);

  // info
  document.getElementById("info-framerate").innerHTML = (
    1 / PhysicsSystem.dt
  ).toFixed(0);
  document.getElementById("info-simrate").innerHTML = (
    (PhysicsSystem.sub_steps * 1) /
    PhysicsSystem.dt
  ).toFixed(0);
  document.getElementById("info-num-rigidbodies").innerHTML =
    psystem.bodies.length;
  document.getElementById("info-num-force-generators").innerHTML =
    psystem.force_generators.length;
  document.getElementById("info-num-constraints").innerHTML =
    psystem.constraints.length;
}

function initButtons() {
  const active_color = "#3d85e1";
  const inactive_color = "#152c47";

  const s1 = document.getElementById("info-save-btn-1");
  const s2 = document.getElementById("info-save-btn-2");
  const s3 = document.getElementById("info-save-btn-3");
  const s4 = document.getElementById("info-save-btn-4");
  const s5 = document.getElementById("info-save-btn-5");
  const s6 = document.getElementById("info-save-btn-6");

  const r1 = document.getElementById("info-reset-save-btn-1");
  const r2 = document.getElementById("info-reset-save-btn-2");
  const r3 = document.getElementById("info-reset-save-btn-3");
  const r4 = document.getElementById("info-reset-save-btn-4");
  const r5 = document.getElementById("info-reset-save-btn-5");
  const r6 = document.getElementById("info-reset-save-btn-6");

  const handleSaveLocation = (save_btn, reset_btn, ls_key) => {
    const updateButtonColor = () => {
      if (localStorage.getItem(ls_key)) {
        save_btn.style.setProperty(
          "background-color",
          active_color,
          "important",
        );
      } else {
        save_btn.style.setProperty(
          "background-color",
          inactive_color,
          "important",
        );
      }
    };

    updateButtonColor();

    save_btn.onclick = () => {
      if (!localStorage.getItem(ls_key)) {
        localStorage.setItem(ls_key, psystem.toJSON());
      } else {
        psystem.set(PhysicsSystem.fromJSON(localStorage.getItem(ls_key)));
      }
      updateButtonColor();
    };

    reset_btn.onclick = () => {
      localStorage.removeItem(ls_key);
      updateButtonColor();
    };
  };

  handleSaveLocation(s1, r1, "xpbd-physicsSystem-save-1");
  handleSaveLocation(s2, r2, "xpbd-physicsSystem-save-2");
  handleSaveLocation(s3, r3, "xpbd-physicsSystem-save-3");
  handleSaveLocation(s4, r4, "xpbd-physicsSystem-save-4");
  handleSaveLocation(s5, r5, "xpbd-physicsSystem-save-5");
  handleSaveLocation(s6, r6, "xpbd-physicsSystem-save-6");
}

function updateChangedUserData() {
  // SETTINGS ---------------------------------------------------------------------------------------------------------------------------
  PhysicsSystem.GRAVITY = document.getElementById(
    "settings-gravity-slider",
  ).value;
  PhysicsSystem.ENERGY_DAMP_MU = document.getElementById(
    "settings-energy-damping-slider",
  ).value;
  PhysicsSystem.SPRING_JOINT_STIFFNESS = document.getElementById(
    "settings-spring-stiffness-slider",
  ).value;
  PhysicsSystem.MOUSESPRING_JOINT_STIFFNESS = document.getElementById(
    "settings-mouse-spring-stiffness-slider",
  ).value;

  // INFO ---------------------------------------------------------------------------------------------------------------------------
  PhysicsSystem.sub_steps = document.getElementById(
    "info-sub-steps-slider",
  ).value;

  // EDITOR ---------------------------------------------------------------------------------------------------------------------
  const rigidbody_type_slider = document.getElementById(
    "editor-rigidbody-type-slider",
  );
  if (rigidbody_type_slider.value == 1) {
    editor.spawner.typeof_rigidbody = "disc";
  } else if (rigidbody_type_slider.value == 2) {
    editor.spawner.typeof_rigidbody = "rect";
  }

  // const joint_type_slider = document.getElementById("editor-joint-type-slider");
  // if (joint_type_slider.value == 1) {
  //     editor.spawner.typeof_joint = "spring";
  // } else if (joint_type_slider.value == 2) {
  //     editor.spawner.typeof_joint = "link";
  // } else if (joint_type_slider.value == 3) {
  //     editor.spawner.typeof_joint = "prismatic-y";
  // } else if (joint_type_slider.value == 4) {
  //     editor.spawner.typeof_joint = "revolute";
  // }

  editor.standard.mass = document.getElementById(
    "editor-rigidbody-mass-slider",
  ).value;
  editor.spawner.constraint_alpha =
    1e-6 * document.getElementById("editor-constraint-compliance-slider").value;
}

function updatePopupWindow(canvas, psystem) {
  const num_dec = 2;
  const infos = psystem.getRigidBodyInfoContainingPoint(
    User.mouse.sim_pos,
    false,
  );
  const popup = document.getElementById("popup-window");

  if (!infos) {
    popup.style.visibility = "hidden";
    return;
  }

  const info = infos[0];

  const rect = canvas.getBoundingClientRect();

  popup.style.visibility = "hidden";

  for (let i = 1; i <= 9; i++) {
    // 9 is max entry id
    document.getElementById("popup-entry-" + i).style.display = "none";
  }

  const updateFigure = (id, name, value, unit) => {
    document.getElementById("popup-name-" + id).innerHTML = name;
    document.getElementById("popup-number-" + id).innerHTML = value;
    document.getElementById("popup-unit-" + id).innerHTML = unit;
    document.getElementById("popup-entry-" + id).style.display = "block";
  };

  const body = info.body;
  if (body instanceof RigidBody) {
    updateFigure(1, "ID", info.id, "");
    updateFigure(2, "Type", "" + body.geometry.type, "");
    updateFigure(3, "Mass", "" + Number(body.mass).toFixed(num_dec), "kg");
    updateFigure(4, "Inertia", "" + body.I.toFixed(num_dec), "kg * m^2");
    updateFigure(5, "Vel", "" + body.vel.magnitude().toFixed(num_dec), "m / s");
    updateFigure(
      6,
      "Omega",
      "" + Math.abs(body.omega).toFixed(num_dec),
      "rad / s",
    );
    updateFigure(
      7,
      "K. Energy",
      "" + body.getKineticEnergy().toFixed(num_dec),
      "J",
    );

    if (body.geometry.type == "disc") {
      updateFigure(8, "Radius", body.geometry.radius.toFixed(num_dec), "m");
    } else if (body.geometry.type == "rect") {
      updateFigure(8, "Width", body.geometry.width.toFixed(num_dec), "m");
      updateFigure(9, "Height", body.geometry.height.toFixed(num_dec), "m");
    }

    popup.style.visibility = "visible";

    return;
  }

  popup.style.visibility = "hidden";
}
