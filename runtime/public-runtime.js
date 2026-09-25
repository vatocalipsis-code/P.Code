/** Frozen P.Code Public Runtime API v1 boundary. */
import {compileSetLang} from "./setlang-compiler.js";
import {validatePLang,validateSetData,validateSetEnvelope,validateSetRender} from "./validator.js";
import {renderPlaneCode,patchSetData,cancelPlaneCodeInteraction,disposePlaneCode} from "./web-renderer.js";
import {createPlaneCodeEngine} from "./public-runtime-core.js";

const descriptor={
  ComponentVersion:"2.10.0",
  GenerationId:"pcode.layout-group.v1",
  SupportedSerializationVersions:[1],
  Capabilities:[]
};

const renderer={
  mount(target,plan,data,render,interaction){renderPlaneCode(target,plan,data,render,interaction)},
  patchData(target,data,render){patchSetData(target,data,render)},
  rerender(target,plan,data,render,interaction){renderPlaneCode(target,plan,data,render,interaction)},
  cancelInteraction(target){cancelPlaneCodeInteraction(target)},
  dispose(target){disposePlaneCode(target)}
};

export const PlaneCodeEngine=createPlaneCodeEngine({
  descriptor,
  compile:compileSetLang,
  validateEnvelope:validateSetEnvelope,
  validatePlan:validatePLang,
  validateData:validateSetData,
  validateRender:validateSetRender,
  renderer
});
