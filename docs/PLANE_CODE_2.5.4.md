# PlaneCode 2.5.4

Status: RELEASED / CURRENT

PlaneCode 2.5.0 restores AggregateActivePanel to PLang and extends raw-source SPL Compiler rules while preserving the separation of SetLang, SetData and SetRender.

## Sets

```text
PLang     = the language used to describe an interface scheme
SetLang   = one concrete interface scheme written in PLang
SetData   = one concrete data set
SetRender = one concrete render environment
```

SetLang is a name for the concrete PLang scheme carried by a plan. It does not extend or alter PLang grammar.

## SetPlan

SetPlan is a plain application file. It is not a runtime layer, language, compositor, validator or renderer.

A SetPlan contains exactly the three independent sets:

```text
SetLang
SetData
SetRender
```

The canonical SetPlan file extension is `.SPL`.

A SetPlan file is named after the application/interface it represents. Example:

```text
example render.SPL
```

SetPlan only packages the three sets together. It does not transfer semantics between them and does not change their individual contracts.

SetPlan always contains all three set slots: SetLang, SetData and SetRender. Any one, two or all three sets may be empty while a plan is being assembled. An empty set carries no meaning. The three sets may be populated incrementally in any order.


## Independent sources

The three sets may come from independent sources and may be recombined for interface testing:

```text
source A -> SetLang
source B -> SetData
source C -> SetRender

SetLang + SetData + SetRender -> application.SPL -> PlaneCode
```

This permits a scheme from one source, data from another source and a render environment from a third source to be tested together.

## Source processing roles

A source may be processed independently for different outputs:

- a SetLang processor extracts an interface scheme and expresses it as SetLang in PLang;
- a SetData processor extracts data, datasets or arrays and expresses them as SetData;
- a SetRender encoder extracts the physical and visual render environment and expresses it as SetRender.

The implementations, APIs and internal algorithms of these processors are NOT YET SPECIFIED.

## SPL Compiler

The SPL Compiler is the directed assembler for SetPlan files. Its basic operation is:

```text
source -> requested Set -> target.SPL
```

The requested Set is exactly one of SetLang, SetData or SetRender. Each target slot is independent. Writing one slot must not modify either of the other two slots.

The source for each requested Set is explicit and may be different from the sources used for the other sets. The Compiler does not choose, infer or substitute sources on its own.

If the source already contains the requested Set, for example another `.SPL` file, the Compiler copies that Set into the matching target slot.

If the source is raw, the Compiler routes it to the corresponding source processor:

```text
source -> SetLang processor   -> SetLang   -> target.SPL
source -> SetData processor   -> SetData   -> target.SPL
source -> SetRender processor -> SetRender -> target.SPL
```

The Compiler does not absorb the responsibilities of those processors. Their implementations, APIs and internal algorithms remain NOT YET SPECIFIED.

A target `.SPL` may be assembled incrementally and in any order. Existing target slots not named by the operation remain unchanged.

The Compiler assembles `.SPL` files. It is not the Renderer, Compositor, Validator, PLang or a replacement for PlaneCode runtime execution.

No CLI command syntax or public programming API for the SPL Compiler is specified in 2.4.0.

## PlaneCode 2.5.0 additions

PLang includes AggregateActivePanel as a child of SimplePanel. AggregateActivePanel may contain Container and represents an aggregate action or aggregate state of its parent SimplePanel. ActivePanel remains the individual-item panel. No additional AggregateActivePanel properties are defined.

Login is identity only. Login is never rendered as visible content. All visible text and pictures are emitted through Container using SetData keyed by Container.Login. A semantic phrase may therefore appear both as a Login and independently as visible SetData content.

When compiling/decompiling a raw source into both structure and data, SetLang must be established before SetData is mapped, because SetLang defines the Container.Login targets used by SetData:

```text
raw source -> SetLang -> Container.Login targets -> SetData
```

SetRender remains independent of this ordering and may be derived separately. This ordering rule does not define compatibility between a ready SetData and a different ready SetLang; that compatibility remains NOT YET SPECIFIED.

Raw-source processing preserves content modality:

```text
visible text  -> SourceText
visible image -> extracted PNG resource -> SourcePicture
```

For image/icon content embedded in a raw source, the corresponding processor extracts the picture resource as PNG and SetData references that PNG through SourcePicture. Existing SourcePicture PNG and intrinsic-alpha rules remain unchanged.

## Unchanged contracts

PlaneCode 2.5.0 does not otherwise change:

- SetData semantics beyond the raw-source mapping rules above;
- SetData semantics;
- SetRender semantics;
- Compositor behavior;
- Renderer behavior;
- Login integration binding;
- transparency or parallax semantics.

The 2.2.1 separation remains intact: SetLang/PLang, SetData and SetRender stay independent until integration.


## 2.5.1 micro-patch

- SetLang inside `.SPL` uses nested PLang entity blocks; nesting defines structural parent-child relations.
- ActivePanel and AggregateActivePanel expose `OnPress` and `OffPress`.
- `NOT_YET_SPECIFIED` is the canonical value for an existing property whose value is not yet defined.
- Procedure binding and application business-action semantics remain NOT YET SPECIFIED.


## 2.5.2 micro-patch

- AggregateActivePanel and ActivePanel have identical visual/render behavior and visual property capabilities.
- They may differ only in placement and dimensions.
- This does not merge their PLang structural roles.
- The WebRenderer applies the same active-panel elevation and press behavior to both types.


## 2.5.3 micro-patch

- AggregateActivePanel always uses intrinsic content length and does not stretch to the parent length.
- Global PanelColor paints panel entities only; BasePanel is environment and Container remains transparent unless explicitly addressed by SetRender.Background.


## 2.5.4 micro-patch

During raw-source decomposition, each visually and semantically independent source unit becomes an independent Container with a unique semantic Login. SetData stores the atomic SourceText or SourcePicture for that Container; SetRender addresses that Container independently. Independent title, amount, currency, label, count and picture units are not flattened into one multiline SourceText.
