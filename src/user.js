import { Vector2 } from "./utils/math.js";
import { Units } from "./utils/units.js";

export class User {
  static mouse = {
    left_down: false,
    sim_pos: Vector2.zero.clone(),
    canv_pos: Vector2.zero.clone(),
    grid_sim_pos: Vector2.zero.clone(),
  };

  /**
   * Specify which key, then specify what type of event, then the method it does
   * @params array An array of objects like this
   *  {
   *  key: "a",
   *  onkeydown_do: foo1,
   *  onkeydown_cond: fee1,
   *  onkeyup_do?: foo2,
   *  onkeyup_cond?: fee2,
   *  }
   */
  static handleKeyboardInputs(doc_keys) {
    for (let i = 0; i < doc_keys.length; i++) {
      const k = doc_keys[i];

      document.addEventListener("keydown", (e) => {
        if (e.key == k.key) k.onkeydown(e);
      });

      if (!k.onkeyup) continue;
      document.addEventListener("keyup", (e) => {
        if (e.key == k.key) k.onkeyup(e);
      });
    }
  }

  /**
   * Updates the mouse position and
   * @param {HTMLCanvasElement} canvas
   */
  static initMouseEventListeners(canvas) {
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.x;
      const y = e.clientY - rect.y;
      User.mouse.canv_pos.x = x;
      User.mouse.canv_pos.y = y;
      User.mouse.sim_pos.set(Units.c2s(User.mouse.canv_pos));
      User.mouse.grid_sim_pos.set(Units.snap_to_grid(User.mouse.sim_pos));
    });

    canvas.addEventListener("mousedown", (e) => {
      User.mouse.left_down = true;
    });

    canvas.addEventListener("mouseup", (e) => {
      User.mouse.left_down = false;
    });

    canvas.addEventListener("mouseleave", (e) => {
      User.mouse.left_down = false;
    });
  }
}
