# PlaneCode 2.2.1

Status: RELEASED / CURRENT

PlaneCode 2.2.1 restores the strict boundary between PLang and SetRender while preserving the complete render feature set introduced in 2.2.0.

Renderer does not inspect or interpret reference images. It receives an already composed structure and an independent SetRender description. SetRender provides the physical and visual environment in which that composition is rendered.

```text
PLang + SetData
      ↓
  validatePLang
      ↓
  Compositor
      ↓
 Composition

SetRender
   ↓
validateSetRender

Composition + SetRender
          ↓
 validateRenderBindings
          ↓
      Renderer
```

## Separation rule

PLang never imports, defines or constrains SetRender properties.

SetRender never imports, defines or constrains PLang entity types or hierarchy.

The only join is performed after composition:

```text
composition.Login ↔ SetRender.Elements[key]
```

That is an integration binding, not grammar inheritance.

## Runtime ownership

- `validatePLang(pLang, setData)` validates PLang and its resolved data sources.
- `validateSetRender(setRender)` validates SetRender syntax only.
- `composePLang(pLang, setData)` consumes PLang and SetData only.
- `validateRenderBindings(composition, setRender)` checks only the concrete join.
- `renderPlaneCode(root, composition, setRender)` renders the already composed structure with the independent render description.

## Lossless correction

No SetRender capability is removed.

Geometry, borders, text appearance, picture tint, transparency and parallax remain available.

PLang hierarchy, Login identity, Container source rules and Compositor semantics remain unchanged.

The removed behavior is only the accidental coupling where SetRender validation required PLang as an input and treated render addressing as part of the PLang schema.

Separate canons:
- `docs/PLANG_CANON.md`
- `docs/SET_RENDER_CANON.md`
