/** Frozen P.Code Public Runtime API v1 boundary. */
import {compileSetLang} from "./setlang-compiler.js";
import {validatePLang,validateSetData,validateSetEnvelope,validateSetRender,validateResources} from "./validator.js";
import {renderPlaneCode,patchSetData,cancelPlaneCodeInteraction,disposePlaneCode,requestTiltParallax,disableTiltParallax} from "./web-renderer.js";
import {createPlaneCodeEngine} from "./public-runtime-core.js";

const descriptor={
  ComponentVersion:"2.18.0",
  GenerationId:"pcode.layout-group.v1",
  SupportedSerializationVersions:[1],
  Capabilities:["pcode.editable-input.v1","pcode.corner-radius.v1","pcode.parallax.v1","pcode.skin-stylesheet.v1","pcode.tilt-parallax.v1","pcode.semantic-repeat.v1","pcode.semantic-model.v1","pcode.semantic-controls.v1","pcode.semantic-routes.v1"]
};

const renderer={
  mount(target,plan,data,render,interaction,resources,styleSheet){renderPlaneCode(target,plan,data,render,interaction,resources,styleSheet)},
  patchData(target,data,render,resources){patchSetData(target,data,render,resources)},
  patchModel(target,data,render,resources){patchSetData(target,data,render,resources,{semanticOnly:true})},
  rerender(target,plan,data,render,interaction,resources,styleSheet){renderPlaneCode(target,plan,data,render,interaction,resources,styleSheet)},
  cancelInteraction(target){cancelPlaneCodeInteraction(target)},
  requestTilt(target){return requestTiltParallax(target)},
  disableTilt(target){disableTiltParallax(target)},
  dispose(target){disposePlaneCode(target)}
};

export const PlaneCodeEngine=createPlaneCodeEngine({
  descriptor,
  compile:compileSetLang,
  validateEnvelope:validateSetEnvelope,
  validatePlan:validatePLang,
  validateData:validateSetData,
  validateRender:validateSetRender,
  validateResources,
  renderer
});
