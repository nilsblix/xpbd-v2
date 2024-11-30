import { Vector2 } from "./utils/math.js";
import { RigidBody } from "./rigid_body.js";
import {
  OffsetLinkConstraint,
  PrismaticYConstraint,
  PrismaticPosConstraint,
  RevoluteJoint,
} from "./constraints.js";
import { SpringJoint } from "./force_generators.js";
import { editor } from "./editor.js";
import { PhysicsSystem } from "./physics_system.js";

/**
 * Setups up a scene. Make sure prev-scene is the nothing scene.
 * @param {string} ver
 * @returns {void}
 */
export function setupScene(ver, psystem) {
  switch (ver) {
    case "test 1":
      const delta = 0.25;

      const p0 = new RigidBody(new Vector2(5, 3.25), 10, {
        type: "rect",
        width: 5,
        height: 0.25,
      });
      const p1 = new RigidBody(new Vector2(2.5 + delta, 2.25), 6, {
        type: "disc",
        radius: 0.5,
      });

      psystem.bodies.push(p0);
      editor.recent_entities.push({
        type: "rigidbody",
        id: psystem.bodies.length - 1,
      });
      psystem.bodies.push(p1);
      editor.recent_entities.push({
        type: "rigidbody",
        id: psystem.bodies.length - 1,
      });

      psystem.addPrismaticJoint(0.0, "pos", 0, Vector2.zero.clone());
      editor.recent_entities.push({
        type: "constraint",
        id: psystem.constraints.length - 1,
      });

      editor.spawnRagdoll(psystem, new Vector2(7.5 - delta, 2.75));

      psystem.addLinkJoint(
        0.0,
        0,
        1,
        new Vector2(-2.5 + delta),
        new Vector2(0, 0.25),
      );
      editor.recent_entities.push({
        type: "constraint",
        id: psystem.constraints.length - 1,
      });
      psystem.addLinkJoint(
        0.0,
        0,
        2,
        new Vector2(2.5 - delta),
        new Vector2(0, 0.1),
      );
      editor.recent_entities.push({
        type: "constraint",
        id: psystem.constraints.length - 1,
      });

      break;

    case "test 2":
      const test_2_json =
        '{"bodies":[{"pos":{"x":2.5242718446601944,"y":4.083333333333333},"prev_pos":{"x":2.5242718446601944,"y":4.083333333333333},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.13758730697386065,"color":"#f7c923","geometry":{"type":"disc","radius":0.5245708855318996,"local_vertices":[],"world_vertices":[]}},{"pos":{"x":3.9805825242718447,"y":3.4166666666666665},"prev_pos":{"x":3.9805825242718447,"y":3.4166666666666665},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.2256941772687331,"color":"#9bf046","geometry":{"type":"disc","radius":0.6718544146892734,"local_vertices":[],"world_vertices":[]}},{"pos":{"x":5.450762829403606,"y":3.2083333333333335},"prev_pos":{"x":5.450762829403606,"y":3.2083333333333335},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.13533238107902218,"color":"#eb63b9","geometry":{"type":"disc","radius":0.5202545167108541,"local_vertices":[],"world_vertices":[]}}],"constraints":[{"type":"OffsetLinkConstraint","alpha":0,"id1":2,"r1":{"x":-0.277392510402219,"y":-0.06944444444444464},"id2":1,"r2":{"x":0.4438280166435504,"y":-0.36111111111111116},"l0":0.7535815772927728,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":0,"id1":1,"r1":{"x":-0.5131761442441056,"y":-0.08333333333333304},"id2":0,"r2":{"x":0.1109570041608876,"y":-0.20833333333333304},"l0":0.9929361617057686,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":0,"id1":0,"r1":{"x":0.4160887656033285,"y":0.09722222222222232},"id2":1,"r2":{"x":-0.23578363384188616,"y":0.3472222222222223},"l0":0.9059426348882382,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"PrismaticPosConstraint","alpha":0,"id":1,"r":{"x":0.06934812760055475,"y":0.5277777777777781},"p0":{"x":4.049930651872399,"y":3.9444444444444446},"lambda":null,"n":{"x":0,"y":0},"C":null}],"force_generators":[{"type":"Gravity"},{"type":"EnergyDamping"}]}';
      psystem.set(PhysicsSystem.fromJSON(test_2_json));

      break;

    case "soft square chain":
      const soft_square_chain_json =
        '{"bodies":[{"pos":{"x":4.5,"y":4.875},"prev_pos":{"x":4.5,"y":4.875},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#f7c923","geometry":{"type":"rect","width":1,"height":0.25,"local_vertices":[{"x":-0.5,"y":-0.125},{"x":-0.5,"y":0.125},{"x":0.5,"y":0.125},{"x":0.5,"y":-0.125}],"world_vertices":[{"x":4,"y":4.75},{"x":4,"y":5},{"x":5,"y":5},{"x":5,"y":4.75}]}},{"pos":{"x":3.875,"y":4.25},"prev_pos":{"x":3.875,"y":4.25},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#9b46f0","geometry":{"type":"rect","width":0.25,"height":1,"local_vertices":[{"x":-0.125,"y":-0.5},{"x":-0.125,"y":0.5},{"x":0.125,"y":0.5},{"x":0.125,"y":-0.5}],"world_vertices":[{"x":3.75,"y":3.75},{"x":3.75,"y":4.75},{"x":4,"y":4.75},{"x":4,"y":3.75}]}},{"pos":{"x":4.5,"y":3.625},"prev_pos":{"x":4.5,"y":3.625},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#9b46f0","geometry":{"type":"rect","width":1,"height":0.25,"local_vertices":[{"x":-0.5,"y":-0.125},{"x":-0.5,"y":0.125},{"x":0.5,"y":0.125},{"x":0.5,"y":-0.125}],"world_vertices":[{"x":4,"y":3.5},{"x":4,"y":3.75},{"x":5,"y":3.75},{"x":5,"y":3.5}]}},{"pos":{"x":5.125,"y":4.25},"prev_pos":{"x":5.125,"y":4.25},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#9b46f0","geometry":{"type":"rect","width":0.25,"height":1,"local_vertices":[{"x":-0.125,"y":-0.5},{"x":-0.125,"y":0.5},{"x":0.125,"y":0.5},{"x":0.125,"y":-0.5}],"world_vertices":[{"x":5,"y":3.75},{"x":5,"y":4.75},{"x":5.25,"y":4.75},{"x":5.25,"y":3.75}]}},{"pos":{"x":4,"y":3.375},"prev_pos":{"x":4,"y":3.375},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#f7c923","geometry":{"type":"rect","width":1,"height":0.25,"local_vertices":[{"x":-0.5,"y":-0.125},{"x":-0.5,"y":0.125},{"x":0.5,"y":0.125},{"x":0.5,"y":-0.125}],"world_vertices":[{"x":3.5,"y":3.25},{"x":3.5,"y":3.5},{"x":4.5,"y":3.5},{"x":4.5,"y":3.25}]}},{"pos":{"x":3.375,"y":2.75},"prev_pos":{"x":3.375,"y":2.75},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#ed4640","geometry":{"type":"rect","width":0.25,"height":1,"local_vertices":[{"x":-0.125,"y":-0.5},{"x":-0.125,"y":0.5},{"x":0.125,"y":0.5},{"x":0.125,"y":-0.5}],"world_vertices":[{"x":3.25,"y":2.25},{"x":3.25,"y":3.25},{"x":3.5,"y":3.25},{"x":3.5,"y":2.25}]}},{"pos":{"x":4,"y":2.125},"prev_pos":{"x":4,"y":2.125},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#ed4640","geometry":{"type":"rect","width":1,"height":0.25,"local_vertices":[{"x":-0.5,"y":-0.125},{"x":-0.5,"y":0.125},{"x":0.5,"y":0.125},{"x":0.5,"y":-0.125}],"world_vertices":[{"x":3.5,"y":2},{"x":3.5,"y":2.25},{"x":4.5,"y":2.25},{"x":4.5,"y":2}]}},{"pos":{"x":4.625,"y":2.75},"prev_pos":{"x":4.625,"y":2.75},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#9b46f0","geometry":{"type":"rect","width":0.25,"height":1,"local_vertices":[{"x":-0.125,"y":-0.5},{"x":-0.125,"y":0.5},{"x":0.125,"y":0.5},{"x":0.125,"y":-0.5}],"world_vertices":[{"x":4.5,"y":2.25},{"x":4.5,"y":3.25},{"x":4.75,"y":3.25},{"x":4.75,"y":2.25}]}},{"pos":{"x":3.5,"y":1.875},"prev_pos":{"x":3.5,"y":1.875},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#9b46f0","geometry":{"type":"rect","width":1,"height":0.25,"local_vertices":[{"x":-0.5,"y":-0.125},{"x":-0.5,"y":0.125},{"x":0.5,"y":0.125},{"x":0.5,"y":-0.125}],"world_vertices":[{"x":3,"y":1.75},{"x":3,"y":2},{"x":4,"y":2},{"x":4,"y":1.75}]}},{"pos":{"x":2.875,"y":1.25},"prev_pos":{"x":2.875,"y":1.25},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#46f0e7","geometry":{"type":"rect","width":0.25,"height":1,"local_vertices":[{"x":-0.125,"y":-0.5},{"x":-0.125,"y":0.5},{"x":0.125,"y":0.5},{"x":0.125,"y":-0.5}],"world_vertices":[{"x":2.75,"y":0.75},{"x":2.75,"y":1.75},{"x":3,"y":1.75},{"x":3,"y":0.75}]}},{"pos":{"x":3.5,"y":0.625},"prev_pos":{"x":3.5,"y":0.625},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#4684f0","geometry":{"type":"rect","width":1,"height":0.25,"local_vertices":[{"x":-0.5,"y":-0.125},{"x":-0.5,"y":0.125},{"x":0.5,"y":0.125},{"x":0.5,"y":-0.125}],"world_vertices":[{"x":3,"y":0.5},{"x":3,"y":0.75},{"x":4,"y":0.75},{"x":4,"y":0.5}]}},{"pos":{"x":4.125,"y":1.25},"prev_pos":{"x":4.125,"y":1.25},"vel":{"x":0,"y":0},"force":{"x":0,"y":0},"mass":"1","theta":0,"prev_theta":0,"omega":0,"tau":0,"I":0.08854166666666666,"color":"#46f0e7","geometry":{"type":"rect","width":0.25,"height":1,"local_vertices":[{"x":-0.125,"y":-0.5},{"x":-0.125,"y":0.5},{"x":0.125,"y":0.5},{"x":0.125,"y":-0.5}],"world_vertices":[{"x":4,"y":0.75},{"x":4,"y":1.75},{"x":4.25,"y":1.75},{"x":4.25,"y":0.75}]}}],"constraints":[{"type":"PrismaticPosConstraint","alpha":0,"id":0,"r":{"x":0.3743386243386242,"y":0.005514705882353255},"p0":{"x":4.874338624338624,"y":4.880514705882353},"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":1,"r1":{"x":0.0006613756613758071,"y":0.398897058823529},"id2":0,"r2":{"x":-0.38624338624338606,"y":0.005514705882353255},"l0":0.3321687475255525,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":2,"r1":{"x":-0.3664021164021163,"y":-0.008455882352941035},"id2":1,"r2":{"x":-0.005952380952380931,"y":-0.3819852941176469},"l0":0.3649990400275319,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":2,"r1":{"x":0.3677248677248679,"y":-0.0018382352941177516},"id2":3,"r2":{"x":0.007275132275132101,"y":-0.40183823529411766},"l0":0.34729215723021273,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":3,"r1":{"x":0.007275132275132101,"y":0.39227941176470615},"id2":0,"r2":{"x":0.3677248677248679,"y":0.012132352941176094},"l0":0.3604716428186587,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":0,"id1":4,"r1":{"x":0.37830687830687815,"y":0.003308823529411864},"id2":2,"r2":{"x":0.003968253968253954,"y":0.004779411764705976},"l0":0.281119615253924,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":5,"r1":{"x":-0.008597883597883715,"y":0.4033088235294118},"id2":4,"r2":{"x":-0.38888888888888884,"y":-0.003308823529411864},"l0":0.3279837559508266,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":5,"r1":{"x":-0.008597883597883715,"y":-0.3775735294117646},"id2":6,"r2":{"x":-0.3756613756613758,"y":-0.004044117647058698},"l0":0.3602342277933692,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":6,"r1":{"x":0.37830687830687815,"y":0.0025735294117645857},"id2":7,"r2":{"x":0.011243386243386055,"y":-0.3908088235294116},"l0":0.3466669533652524,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":7,"r1":{"x":-0.001984126984127421,"y":0.38345588235294104},"id2":4,"r2":{"x":0.37830687830687815,"y":0.003308823529411864},"l0":0.3461725796394841,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":0,"id1":8,"r1":{"x":0.3822751322751321,"y":0.0011029411764706953},"id2":6,"r2":{"x":0.0013227513227516141,"y":0.0025735294117645857},"l0":0.27822615324284644,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":9,"r1":{"x":0.001984126984126977,"y":0.3944852941176471},"id2":8,"r2":{"x":-0.3849206349206349,"y":-0.005514705882353033},"l0":0.3275886786865933,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":9,"r1":{"x":-0.004629629629629761,"y":-0.393014705882353},"id2":10,"r2":{"x":-0.39814814814814836,"y":0.0003676470588235281},"l0":0.32746054830762,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":10,"r1":{"x":0.3822751322751321,"y":-0.006249999999999978},"id2":11,"r2":{"x":0.001984126984127421,"y":-0.40625},"l0":0.3324266717510601,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":11,"r1":{"x":-0.004629629629629761,"y":0.3812500000000001},"id2":8,"r2":{"x":0.3756613756613758,"y":0.0011029411764706953},"l0":0.34617257963948395,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":1,"r1":{"x":-0.01256613756613767,"y":-0.24301470588235308},"id2":0,"r2":{"x":0.24867724867724839,"y":0.012132352941176094},"l0":1.2490341007417902,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":2,"r1":{"x":-0.26058201058201025,"y":0.004779411764705976},"id2":3,"r2":{"x":0.0006613756613758071,"y":0.2533088235294114},"l0":1.2443797542865023,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":3,"r1":{"x":0.007275132275132101,"y":-0.22977941176470562},"id2":0,"r2":{"x":-0.24735449735449766,"y":-0.0011029411764704733},"l0":1.2257698812413143,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":2,"r1":{"x":0.22883597883597862,"y":0.01139705882352926},"id2":1,"r2":{"x":-0.005952380952380931,"y":0.24669117647058858},"l0":1.2162820365711606,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":6,"r1":{"x":-0.26322751322751303,"y":0.0025735294117645857},"id2":7,"r2":{"x":0.004629629629629761,"y":0.2577205882352942},"l0":1.25373550747625,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":6,"r1":{"x":0.2592592592592595,"y":0.009191176470588314},"id2":5,"r2":{"x":0.004629629629629761,"y":0.2511029411764705},"l0":1.2350240050735153,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":5,"r1":{"x":-0.021825396825396748,"y":-0.24522058823529402},"id2":4,"r2":{"x":0.2658730158730158,"y":-0.003308823529411864},"l0":1.258790848523959,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":7,"r1":{"x":0.011243386243386055,"y":-0.23860294117647074},"id2":4,"r2":{"x":-0.26322751322751303,"y":0.003308823529411864},"l0":1.2492333275975533,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":10,"r1":{"x":-0.2526455026455028,"y":0.0003676470588235281},"id2":11,"r2":{"x":0.008597883597883715,"y":0.2422794117647058},"l0":1.2397432586812527,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":10,"r1":{"x":0.25,"y":-0.006249999999999978},"id2":9,"r2":{"x":-0.011243386243386055,"y":0.2488970588235293},"l0":1.2490341007417902,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":9,"r1":{"x":-0.017857142857142794,"y":-0.23419117647058818},"id2":8,"r2":{"x":0.28306878306878325,"y":0.014338235294117707},"l0":1.2729463671026273,"lambda":null,"n":{"x":0,"y":0},"C":null},{"type":"OffsetLinkConstraint","alpha":1e-8,"id1":11,"r1":{"x":0.008597883597883715,"y":-0.2408088235294117},"id2":8,"r2":{"x":-0.2592592592592591,"y":0.014338235294117707},"l0":1.2537355074762497,"lambda":null,"n":{"x":0,"y":0},"C":null}],"force_generators":[{"type":"Gravity"},{"type":"EnergyDamping"}]}';
      psystem.set(PhysicsSystem.fromJSON(soft_square_chain_json));

      break;

    default:
      console.warn("Tried to setup unknown scene. Tried: " + ver);
  }
}
