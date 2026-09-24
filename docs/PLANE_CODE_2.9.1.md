# PlaneCode 2.9.1

Status: CURRENT

PlaneCode 2.9.1 is a backward-compatible property release within the existing PlaneCode generation.

The structural grammar is unchanged:

```text
BasePanel -> SimplePanel -> ActivePanel
```

AggregateActivePanel remains a special ActivePanel on the Active physical layer.

## New SetLang properties

### PanelTransparency

Available only on:

- SimplePanel
- ActivePanel
- AggregateActivePanel

`PanelTransparency` is a finite number in `0..1`.

- `0` = opaque panel surface
- `1` = fully transparent panel surface

It affects only the panel's own surface. It does not hide Containers, text, PNG content, child panels, interaction, geometry, layout, Parallax, or content shadows.

Container remains a transparent content slot and has no PanelTransparency property.

### Shadow

Available only on:

- SimplePanel
- ActivePanel
- AggregateActivePanel

`Shadow` is a finite non-negative content-shadow depth/strength.

- `0` = no content shadow
- positive values = increasing shadow depth/strength

Shadow follows visible content alpha:

- text shadow follows glyphs
- PNG shadow follows intrinsic PNG alpha
- transparent PNG pixels cast no content shadow

The panel bounding rectangle does not define the content-shadow shape. The renderer owns the physical blur/offset mapping.

Container has no Shadow property.

## Compatibility

No new structural entity or layer is introduced. Existing 2.9.0 SetLang that does not use these properties remains valid under 2.9.1.

SetData and SetRender contracts are unchanged.
