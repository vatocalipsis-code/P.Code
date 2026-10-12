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
