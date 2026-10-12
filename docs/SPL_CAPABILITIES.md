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

## Panels in authored layout (2.32.0)

`pcode.layout-panels.v1` allows `SimplePanel` and `ActivePanel` entities in `Layout`, including inside `Flow` and `Group`. Their explicit types survive SPL parsing/serialization. Existing panel collections retain their unchanged syntax and rendering. The compiler preserves ordering and panel interaction semantics; the renderer owns nested panel creation, model updates and event dispatch. Layout and panel nesting share the 32-level validation budget. This capability introduces no application-specific wrappers, identifiers or business behavior.

### `pcode.stepped-fields.v1` (2.33.0)

`BasePanel.Properties.SceneEffects.SteppedFields` declares native textarea measurement:

```
SteppedFields {
  Selector = "textarea.note"
  UnitVariable = "--row-height"
  DefaultUnit = 42
  Class = "measured"
}
```

The selector is scoped to the declaring panel. The positive CSS unit is read from the document root, with a positive numeric fallback. The runtime batches field writes, measurements and final writes in one animation frame; height is the number of text lines times the selected unit. Value, width, font and unit form the measurement cache key. Input, scene updates, resize and font loading invalidate measurements as needed. Hidden scenes are not measured. Runtime disposal cancels pending frames and observers. No application data or command names are interpreted.

### `pcode.structured-events.v1` (2.34.0)

Runtime events may include `Payload` containing validated JSON data. The public boundary clones the payload; it neither interprets nor stores it as a text input value. Unsupported, executable or unsafe payloads are rejected before delivery. Existing string `Value` / `ItemId` events retain their contracts.

### `pcode.audio-capture.v1` (2.34.0)

`SceneEffects.AudioCapture` owns browser microphone acquisition, MediaRecorder and an SPL-authored canvas waveform. It requires `pcode.structured-events.v1`. The `Source` semantic object supplies a session `id`, supported `formats`, `bitsPerSecond`, `maxBytes`, `durationMs` and optional `stop`. `SessionSource` identifies the surrounding input session even before capture starts; a different session clears the previous waveform. Closing or disposing the scene releases streams and cancels timers/frames, including streams returned after a late permission resolution.

The effect emits `Command` as an `OnInput` event with structured `Payload`: `sessionId` plus `status` (`recording`, `recorded`, `error`). A recorded result carries `mime` and base64 `audio`; an error carries a machine code. It does not call a transcription service or interpret the result. The application owns API requests, authorization and any use of the input.

`Waveform` names an authored Flow canvas. `Width`, `Height`, `Bars`, `BarInset`, `BarWidth`, `SampleStride`, `Divisor`, `MinBarHeight`, `ColorVariable`, `ColorScope` (`Root` or `Panel`) and `FallbackColor` belong exclusively to SPL. No product, theme, text label or service endpoint is embedded in the runtime.

### `pcode.modal-transition.v1`

A modal BasePanel may declare `ModalExit: { Effect: "Fade", Duration: 140 }`.
Duration is bounded to 0–1000 milliseconds. On semantic closure Picot stops scene
input effects and restores focus immediately, while keeping the outgoing DOM
unchanged and inert until its fade ends. Reopening cancels the old exit; disposal
cancels every pending animation. This rule contains no application commands or
business state transitions. Screens without it retain immediate closure.

### `pcode.group-presentation.v1`

Anonymous layout Groups accept authored `Class`, semantic `StateSource` and
`EnabledSource`. Picot applies state, aria-disabled and inert to the group,
including subsequent model updates; descendants cannot receive browser focus or
pointer input while the group is disabled. Child field rules remain independent.
Group visibility continues to require `pcode.group-state.v1`. No application
identifiers or domain permission calculations occur in the renderer.

## Semantic native tooltips (2.36.0)

`pcode.semantic-title.v1` adds `TitleSource` on semantic components. SPL chooses
the field; Picot updates the native `title` tooltip as the root/repeated record
changes. Null/empty values remove the tooltip. This is presentation metadata,
not an application DOM callback. Paths and capability negotiation are validated.

Keyed repeat updates now patch the existing authored subtree for flat record
templates. Focus and selection survive data changes and reordering; unchanged
rows are neither detached nor rebuilt. Removed rows cancel pending presses.
Native `moveBefore` is used when available, with retained-control focus/selection
restoration for older browsers. Nested-repeat templates retain their existing
rebuild path. Reproduce with `tests/check-repeat-continuity-browser.mjs` in
Chromium and WebKit; this fixture defines no application skin.

## `pcode.action-menu.v1`

An `ActivePanel` may declare `ActionMenu`. The renderer owns its transient DOM,
focus, keyboard navigation, outside dismissal, hold timer and disposal. The
application receives only the opaque `OffPress` command and optional repeated
record `ItemId`. No product action is executed by the renderer.

`Trigger` is `Press` (exclusive anchor activation) or `Context` (right click /
long press; normal `OffPress` remains the primary action). NativeButton anchors
are not supported because menu buttons must not be nested in a native button.
`Class` is required; `AnchorClass`, `ButtonClass`, `BodyClass`, `AriaLabel`,
`WidthLabel` / `WidthPadding`, `HoldDelay` and `MoveTolerance` are optional.
`Items` is an ordered dictionary of 1–32 entries. Each entry has `Text` or a
semantic `Source` and optional Text `Format`, local canonical `Picture`,
`OffPress`, `EnabledSource`, `VisibleSource`. The menu itself may also have
`EnabledSource`. Semantic bindings require `pcode.semantic-model.v1`.

Updates preserve menu button identity. Permission revocation, route hiding,
record removal, back consumption and runtime disposal close the menu. The
runtime rechecks live availability before emitting a command; it never derives
business permissions. Application API authorization remains independently
required. Movement cancels a pending hold, and a hold suppresses the primary
record action. Captured outside clicks dismiss without activating background
controls.

Checks: `node --test tests/action-menu.test.js` and
`PLAYWRIGHT_MODULE=... UI_BROWSER=chromium|webkit node tests/check-action-menu-browser.mjs`.

## `pcode.repeat-subset.v1`

An authored repeated panel or Flow may declare `RepeatIds [ "id-a" "id-b" ]`.
The renderer includes only these record IDs, retaining the incoming semantic
order and keyed node identity. The list must contain unique nonempty strings,
with at most 5000 entries. It requires `Repeat`; absent records produce no DOM.
This allows a skin to compose catalog bands without requiring the application
to know column counts or send decorative groups. It is a presentation filter,
not authorization; application commands still validate allowed entity IDs.

All source records are validated before the subset is applied, including duplicate
IDs outside the subset. Empty subsets render no entries. Filtering, disposal,
focus/caret continuity and semantic ItemId dispatch use the standard repeat path.

Checks: `node --test tests/repeat-subset.test.js` and
`PLAYWRIGHT_MODULE=... UI_BROWSER=chromium|webkit node tests/check-repeat-continuity-browser.mjs`.

## `pcode.modal-slide.v1`

`ModalEnter` and `ModalExit` may author `{ Effect = "Slide", Speed = 4.68,
Acceleration = 0.12 }`. They reuse the route motion curve; the application does
not calculate keyframes or manipulate the DOM. Speed is 1–100 viewport widths
per second, acceleration 0–1 seconds, with Speed × Acceleration ≤ 2 so the
curve completes within one viewport. Enter and exit are cancelled when the
scene changes or the runtime is disposed. Exit preserves outgoing contents until
completion and reopening cancels that exit. Reduced motion skips the entrance
and completes the exit immediately. Existing Fade exits remain compatible.

Checks: `node --test tests/modal-slide.test.js` and
`UI_MODAL_SLIDE=1 PLAYWRIGHT_MODULE=... UI_BROWSER=chromium|webkit node tests/check-modal-transition-browser.mjs`.

### `pcode.decimal-projection.v1` (2.40)

Decimal formats may author `Precision` (integer 0–12) and an explicit `Rounding`
(`Truncate` or `HalfTowardZero`). `ReciprocalSource` optionally references a global
boolean semantic path. These are display projections only: input/state values
are never rewritten. Projection uses exact integer arithmetic, supports source
scale up to 24, and returns the authored text `Fallback` for the reciprocal of
zero. Nested Composite formats must negotiate the capability too. Omitted
projection properties preserve the original decimal contract.

Decimal projection also accepts `Output: "Text"` to emit the formatted quantity as a single text segment. Composite text parts then wrap as one uninterrupted text run; the semantic quantity is unchanged. This option requires `pcode.decimal-projection.v1`.
