# SetRender Canon

Status: CURRENT

SetRender is an independent render description used by PlaneCode.

SetRender does not define PLang entities, hierarchy, parent/child relations, source presence or source order. It does not extend PLang grammar.

Its job is only physical and visual rendering. SetRender describes the render environment; it does not inspect reference images or derive structure/content from them.

## Addressing

`Elements` is a map of render instructions keyed by strings.

In PlaneCode integration, a key can be bound to the `Login` of an entity in a concrete composition:

```text
composition.Login ↔ SetRender.Elements[key]
```

That match is an integration binding. It is not a PLang rule and it is not part of SetRender syntax validation.

## Global properties

```text
PanelSpacing
BackgroundColor
PanelColor
BorderColor
TextColor
Transparency
TextTransparency
PictureTransparency
Parallax
```

Transparency values are 0..1.

Structural Transparency affects structural paint such as fill and border. It does not alter SourceText or SourcePicture opacity.

TextTransparency and PictureTransparency are independent.

Parallax is a signed finite number of logical pixels. Zero disables parallax.

## Element properties

All are optional:

```text
Background

BorderColor
BorderWidth
BorderLeftColor
BorderLeftWidth
BorderRightColor
BorderRightWidth
BorderTopColor
BorderTopWidth
BorderBottomColor
BorderBottomWidth

TextColor
FontSize
FontWeight

PictureTint

Width
Height
Padding
Gap
Alignment
Distribution
Direction

Parallax
```

These properties belong only to SetRender.

Their existence does not add fields, capabilities or semantics to PLang.

`Width`, `Height`, `Padding`, `Gap`, border widths and `FontSize` are non-negative finite logical-pixel values.

`FontWeight` is an integer from 1 to 1000.

```text
Direction = Horizontal | Vertical
Alignment = Start | Center | End | Stretch
Distribution = Start | Center | End | Between | Around | Evenly
```

SetRender does not declare which PLang type a render instruction is allowed to belong to. Doing so would couple the two contracts.

## Background

Background is optional. Absence means no explicit fill instruction.

## PictureTint

PictureTint changes visible picture color while preserving PNG alpha shape.

## Parallax

Parallax belongs entirely to rendering. It does not modify PLang or Compositor output.
