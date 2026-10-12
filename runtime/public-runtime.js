import {resolveFormatLibrary} from './format-library.js';
/** Frozen P.Code Public Runtime API v1 boundary. */
import {compileSetLang} from "./setlang-compiler.js";
import {validatePLang,validateSetData,validateSetEnvelope,validateSetRender,validateResources} from "./validator.js";
import {renderPlaneCode,patchSetData,cancelPlaneCodeInteraction,disposePlaneCode,requestTiltParallax,disableTiltParallax,consumePlaneCodeBack} from "./web-renderer.js";
import {createPlaneCodeEngine} from "./public-runtime-core.js";

const descriptor={
  ComponentVersion:"2.41.0",
  GenerationId:"pcode.layout-group.v1",
  SupportedSerializationVersions:[1],
  Capabilities:["pcode.control-action.v1","pcode.decimal-projection.v1","pcode.modal-slide.v1","pcode.repeat-subset.v1","pcode.action-menu.v1","pcode.semantic-title.v1","pcode.group-presentation.v1","pcode.modal-transition.v1","pcode.structured-events.v1","pcode.audio-capture.v1","pcode.stepped-fields.v1","pcode.layout-panels.v1","pcode.native-confirm.v1","pcode.choice-format.v1","pcode.panel-action.v1","pcode.choice-empty.v1","pcode.flow-layout.v1", "pcode.scene-effects.v1","pcode.decimal-sign.v1","pcode.native-button-text.v1","pcode.group-state.v1","pcode.panel-composition.v1","pcode.format-library.v1","pcode.vector.v1","pcode.editable-input.v1","pcode.corner-radius.v1","pcode.parallax.v1","pcode.skin-stylesheet.v1","pcode.tilt-parallax.v1","pcode.semantic-repeat.v1","pcode.semantic-model.v1","pcode.semantic-controls.v1","pcode.semantic-routes.v1","pcode.composite-format.v1","pcode.control-feedback.v1","pcode.numeric-editor.v1","pcode.decimal-preview.v1","pcode.semantic-accessibility.v1","pcode.decimal-unit-layout.v1"]
};

const renderer={
  mount(target,plan,data,render,interaction,resources,styleSheet){renderPlaneCode(target,plan,data,render,interaction,resources,styleSheet)},
  patchData(target,data,render,resources){patchSetData(target,data,render,resources)},
  patchModel(target,data,render,resources){patchSetData(target,data,render,resources,{semanticOnly:true})},
  rerender(target,plan,data,render,interaction,resources,styleSheet){renderPlaneCode(target,plan,data,render,interaction,resources,styleSheet)},
  consumeBack(target){return consumePlaneCodeBack(target)},
  cancelInteraction(target){cancelPlaneCodeInteraction(target)},
  requestTilt(target){return requestTiltParallax(target)},
  disableTilt(target){disableTiltParallax(target)},
  dispose(target){disposePlaneCode(target)}
};

export const PlaneCodeEngine=createPlaneCodeEngine({
  descriptor,
  resolveLang:resolveFormatLibrary,
  compile:compileSetLang,
  validateEnvelope:validateSetEnvelope,
  validatePlan:validatePLang,
  validateData:validateSetData,
  validateRender:validateSetRender,
  validateResources,
  renderer
});
