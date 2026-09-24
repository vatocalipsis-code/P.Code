# SPL reference

`.SPL` is the SetPlan file format. A SetPlan packages exactly three independent Set objects: SetLang, SetData, and SetRender.

## Top-level shape

```text
SetLang {
  Name = "модель"
  Version = 1
  Data { ... }
}

SetData {
  Name = "данные"
  Version = 1
  Data { ... }
}

SetRender {
  Name = "сцена"
  Version = 1
  Data { ... }
}
```

`Name`, `Version`, and `Data` are peer properties of each Set object.

## Typed SetLang grammar

SetLang does not use a generic `children[]` collection.

```text
BasePanel "Application" {
  Properties {
    Background = "#031421"
    Padding = 12
  }

  Containers [
    Container "Background art" {
      Properties {
        Transparency = 0
      }
    }
  ]

  SimplePanels [
    SimplePanel "Cash group" {
      Properties {
        AggregateActivePanels [
          AggregateActivePanel "Cash group header" {
            Properties {
              Visible = "Yes"
            }
            Containers [ ... ]
          }
        ]
      }

      Containers [ ... ]

      ActivePanels [
        ActivePanel "Main cash" {
          Properties {
            Parallax = 4
          }
          Containers [ ... ]
        }
      ]
    }
  ]
}
```
The repository's [example SetPlan](../plans/example%20render.SPL) is the concrete current-format example.

## Containers and SetData

A Container is an addressable visible-content slot. Its `Login` is the key used by SetData.

```text
Container "Main cash.Amount" {
  Properties {
    TextColor = "#E8F2FF"
    FontSize = 24
  }
}
```

```text
SetData {
  ...
  Data {
    "Main cash.Amount" {
      SourceText = "125 000"
    }
  }
}
```

A Container may resolve `SourceText`, `SourcePicture`, or both. Login itself is never visible content.

## Object properties

Current object-property families include geometry, layout, borders, colors, typography, picture tint, parallax, panel-surface transparency, and alpha-shaped content shadow. `PanelTransparency` and `Shadow` are valid only on SimplePanel, ActivePanel, and AggregateActivePanel; Container remains a transparent content slot. See [PLANG_CANON.md](PLANG_CANON.md) for the canonical list and semantics.

Example panel properties:

```text
ActivePanel "Floating action" {
  Properties {
    PanelTransparency = 1
    Shadow = 8
  }
  Containers [ ... ]
}
```

`PanelTransparency = 1` removes the panel surface without hiding its Container content. `Shadow` follows text glyphs and PNG alpha rather than the panel rectangle.

Unknown properties are ignored by an engine that does not know them. Missing known properties use the defined inheritance/default behavior. Structural types are not subject to this tolerant-property rule.

## SetRender

SetRender contains scene/global values only. It must not contain object addressing or object-specific geometry/style. See [SET_RENDER_CANON.md](SET_RENDER_CANON.md).

## Undefined semantics

`NOT_YET_SPECIFIED` means the property exists but its value/semantics have not yet been defined. It must not be replaced by an inferred implementation.
