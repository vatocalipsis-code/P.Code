# PlaneCode 2.4.0

Status: RELEASED / CURRENT

PlaneCode 2.4.0 adds the SPL Compiler while preserving the PLang, SetLang, SetData, SetRender, SetPlan, Compositor and Renderer contracts.

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

## Unchanged contracts

PlaneCode 2.4.0 does not change:

- PLang grammar or hierarchy;
- SetData semantics;
- SetRender semantics;
- Compositor behavior;
- Renderer behavior;
- Login integration binding;
- transparency or parallax semantics.

The 2.2.1 separation remains intact: SetLang/PLang, SetData and SetRender stay independent until integration.
