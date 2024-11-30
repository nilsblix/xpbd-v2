console.log("loaded main.js");

import { Units } from "./utils/units.js";
import { Render } from "./utils/render.js";

import { start, update } from "./engine.js";

const canvas = document.getElementById("engine");

Units.init(canvas);
Render.init(canvas.getContext("2d"));

start(canvas);
update(canvas);
