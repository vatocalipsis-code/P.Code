# SPL capability boundary

P.Code owns the generic renderer and `runtime/renderer.css`. It must not contain
host application names or skin names. A skin owns its presentation tree and its
visual parameters in `SetLang` and `SetRender`. The host supplies data and opaque
actions; it does not choose visual properties on behalf of a skin.

An SPL can declare required engine features in `SetLang.Requires`:

```spl
SetLang {
  Name = "example"
  Version = 1
  Requires [
    "pcode.editable-input.v1"
    "pcode.corner-radius.v1"
  ]
  Data { ... }
}
```

The host passes these names to `PlaneCodeEngine.connect` as required capabilities.
Preparation rejects a requirement that was not negotiated. Validation also rejects
unknown visual and scene properties, so an SPL cannot silently lose an unsupported
effect. A new generic feature is added to P.Code's capability list, validator,
renderer, and tests. Only skins using it need to request it and set its parameters.

`pcode.corner-radius.v1` maps `CornerRadius` in a visual Properties block to the
browser's border radius. `pcode.parallax.v1` advertises the existing `Parallax`
rendering capability; a skin can request it when it uses that effect.

`pcode.tilt-parallax.v1` is an opt-in device orientation signal. A skin declares
the capability and `SetRender.Data.TiltParallax { MaxOffset = 6 Smoothing = 0.18 }`.
The active RuntimeHandle exposes `requestTilt()` and `disableTilt()`; the host
must call `requestTilt()` in a direct user press so an iPhone can ask permission.
P.Code publishes bounded `--pcode-tilt-x` and `--pcode-tilt-y` pixel variables
on the render root. Only the SPL stylesheet decides which decorative layers or
shadows respond. Without permission, device events, or when reduced motion is
selected, the skin remains static. Disposal removes listeners and variables.

`pcode.skin-stylesheet.v1` lets an SPL carry `SetLang.StyleSheet` as browser CSS
for cases such as theme variants, pseudo states and responsive layout. P.Code
installs this CSS only while that skin is mounted and removes it on disposal.
The P.Code renderer stylesheet remains skin independent; a host does not select
CSS files. The SPL must declare the stylesheet capability. CSS imports and remote
URLs are rejected. A stylesheet is a declarative skin resource,
not a replacement for typed PLang properties when those can express the style.
Multiline CSS can be written between triple quotes. `SetLang.ThemeContract` is
optional: `SelfContained` keeps all authored colors, while `HostMapped` signals a
legacy host palette transform. New skins should use `SelfContained` and theme
variables in their own stylesheet.

`pcode.semantic-repeat.v1` lets an SPL own a repeated `ActivePanel` template.
The template declares `Repeat = "collection.login"`; child `Container` nodes
declare `Source = "field"`. The host sends `SetData.Data["collection.login"].Items`
as records with stable string `Id` and `Fields` containing `SourceText` or
`SourcePicture`. P.Code creates and patches every row. A press event carries the
opaque action token plus `ItemId`, so the host handles the selected entity without
knowing which visual node was pressed. Repeated collections are limited to 5000
items and cannot contain HTML or layout values.
# Semantic model boundary (2.17.0)

`pcode.semantic-model.v1` negotiates `runtime.applyModel(model)`. The model is a
cloned JSON object containing domain values and identifiers, without DOM, HTML,
CSS, theme names or component descriptions. Invalid updates are rejected before
changing the mounted model. Render failures dispose the incomplete view.

SPL owns `Source` paths (`$.path` for the root model, `@.field` for a repeated
record), `Repeat`, `Class`, `Format`, `StateSource`, `VisibleSource` and
`ExpandedSource`. Semantic repeats also require `pcode.semantic-repeat.v1` and
use records with unique string `id` values. Events carry that identity as
`ItemId`; application commands need not interpret the visual `ObjectLogin`.

`Format.Kind` supports Text, Picture (skin-owned map of local assets), Decimal
(exact integer units, scale, precision, optional unit) and DateTime (locale and
Intl options). Decimal formatting performs no currency conversion or business
calculation. Structured formatter properties round-trip through the SPL parser
and serializer; unsupported structured properties are rejected, never dropped.

Repeated records retain unchanged DOM by ID. Removed records cancel pending
presses. Root binding changes update dependent records, including expansion.
Semantic updates only patch model-bound sources; they do not recompile the skin
or rebuild unrelated input fields. Font/image resource indexes are retained until
their resource set changes or the runtime is disposed. Unchanged model-bound
content retains its DOM across semantic updates.

## Native semantic controls (2.18)

`pcode.semantic-controls.v1` adds Choice, Multiline, Range and Checkbox inputs
and native ActivePanel buttons (`NativeButton = true`). Sources, available
choices, enabled/read-only state and validation bind to the same semantic model.
Choice records have unique IDs; labels, unavailable suffixes, placeholders and
format templates are authored by SPL. Values and commands return through normal
runtime events, without exposing native controls to the application.

A BasePanel with `Modal = true`, `VisibleSource`, optional `ModalClass` and an
opaque `Dismiss` command is a runtime-managed dialog. Picot owns the wrapper,
background inert state, focus trapping/restoration and Escape/backdrop handling.
The application decides whether the dismissal command changes semantic state;
it never removes the dialog DOM. `Format.Template` interpolates scalar fields
and fallback paths without HTML or executable expressions.
For breadcrumb-like text, `Format.ListSeparator`, `Prefix` and `Suffix` format
an array of scalar semantic values. The application supplies the path values;
SPL supplies the separator and decoration. ActivePanel `AriaLabel` is applied by
the renderer, including native buttons.

## Declarative native layout and scene behavior (2.28.0)

`pcode.flow-layout.v1` allows `Flow` in a panel's `Layout`. Each Flow has a
unique Login, a validated native Tag, optional Class, semantic Source/Format,
state/accessibility sources, and child Layout or one content source. Supported
Tags are div, section, article, p, span, strong, small, time, label, button and
h1–h3. Native buttons emit an opaque OffPress command; repeated buttons include
the semantic ItemId. Flow uses the same keyed Repeat implementation as panels.
It does not accept HTML, inline style, event code, or arbitrary attributes.
Static Vector content negotiates `pcode.vector.v1`; `Linkify = true` makes
HTTP(S) tokens into safe text anchors with noopener/noreferrer.

`pcode.scene-effects.v1` allows SceneEffects on a BasePanel. Its declarative
rules reference child Logins, never product handlers:

- Viewport: TopVariable and HeightVariable track the visual viewport.
- AutoSize: Target, RowHeight, MultilineHeight, MultilineClass control a textarea.
- Scroll: Target and Threshold preserve scroll position or a pinned end.
- Resize: Handle, Target, MinHeight, ViewportMargin define vertical resizing.
- Focus: Target, CompactTarget, CompactWidth choose initial focus.
- Outside: Target, Scope, Command emit an opaque command outside an open region.

The runtime installs and disposes observers/listeners with its mounted scene.
Numeric limits, CSS variable/class syntax, shape keys and commands are validated.
EditableInput of InputType Multiline can declare Rows (1–100).
Application models contain data and command results, not these presentation rules.

## Semantic panel activation (2.29.0)

`pcode.panel-action.v1` allows an opaque OffPress on SimplePanel or a Flow
with Role button. Picot owns pointer and Enter/Space activation. Native nested
buttons and links keep their own actions; a parent does not also emit a command.
Disabled state and the global interaction gate are honored. Repeated panels
emit their semantic ItemId. No application handler is attached to DOM nodes.

SceneEffects.Scroll optionally accepts LatestSource, a semantic path. A changed
record key pins the scroll target to its end; otherwise position is preserved.
Closed scenes do not read scroll geometry.

## Native choice placeholder policy (2.30.0)

`pcode.choice-empty.v1` permits `EditableInput` of InputType Choice to declare
`EmptyChoice = false`. The native select then contains only authored semantic
choices. The default still supplies the existing empty/placeholder option.
The option policy belongs to SPL; selected values and allowed records remain
application data. Non-boolean policies and use on other input types are rejected.

## Modal activation order (2.30.1)

Modal focus, inert background and stacking follow opening order, independently of declaration order. Closing the stack restores its original opener; newly mounted background children have their initial inert state restored. Unchanged semantic updates do not rewrite modal display, hidden, aria-hidden or inert state. Reproduce with `PLAYWRIGHT_MODULE=... node tests/check-modal-stack-browser.mjs` and `UI_BROWSER=webkit` for WebKit. This fixture defines no application theme.

## Native decisions and choice text (2.31.0)

`pcode.native-confirm.v1`: a BasePanel may declare `SceneEffects.Confirm` with a semantic `Source`, a `Messages` map authored by the skin, and opaque `Accept` / `Reject` commands. A newly requested decision opens the browser's native confirmation; its string key returns as `Value`. Unrelated model updates do not repeat it. Closed/disposed scenes cannot prompt. The runtime does not interpret the decision key or perform the requested action.

`pcode.choice-format.v1`: a native Choice can use a Text or Composite format for option text. Formatting is owned by SPL, while available option records and stable IDs remain semantic data. Picture/markup option results are rejected; native options contain plain text only. Existing template-only choices remain compatible.

Verification: 85 unit tests; `tests/check-scene-effects-browser.mjs` passes native acceptance/rejection and duplicate-prompt prevention in Chromium and WebKit. `tests/check-modal-stack-browser.mjs` covers reverse declaration order, nested stacking, Escape, Tab and focus restoration in both engines.
