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
