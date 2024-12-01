export const Colors = {
  editor_mouse: "#f55742",
  outlines: "#000000",
  hologramic_spawning: "#87cfff99",
  hologramic_spawning_outline: "#1c73ad",
  body_outlines: "#000000",
  disc_body: "#f0f0f0", // "#fac943",
  rect_body: "#f0f0f0", // "#a15ed1",
  link_constraint: "#ffffff",
  fixed_y_constraint: "#ffffff",
  bodies_bounding_box: "#00ff00",
  spring_joint: "#ffffff",
  revolute_joint: "#ffffff",

  body_colors: [
    "#ed4640",
    "#f7c923",
    "#9bf046",
    "#46f0e7",
    "#4684f0",
    "#9b46f0",
    "#eb63b9",
  ],

  debug: {
    green: "#00ff00",
    dark_green: "#416938",
  }

};

/**
 * All in SIM-SPACE
 */
export const LineWidths = {
  lines_outlines: 0.01,
  hologramic_outline: 0.03,
  bodies: 0.01,
  link_constraint: 0.04,
  fixed_y_constraint_rad: 0.05,
  fixed_constraints_outlines: 0.01,
  fixed_constraints_lines: 0.02,
  spring_joint_horizontal_line: 0.04,
  revolute_joint: 0.005,
};

export const RenderConstants = {
  spring_joint_segments: 16,
  spring_joint_box_width: 0.05,
  spring_joint_box_height: 0.1,
  spring_joint_box_radius: 0.01,
  spring_joint_spring_width: 0.18,
  spring_joint_segment_width: 0.03,
  revolute_joint_radius: 0.03,
};
