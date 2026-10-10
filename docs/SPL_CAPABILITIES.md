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
