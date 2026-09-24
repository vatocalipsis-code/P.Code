# PlaneCode 2.6.0

Status: CURRENT

Contract boundary migration:

- SetRender is scene/global only.
- SetRender has no `Types`, `Elements`, Login bindings or per-object visual properties.
- SetLang owns all concrete object physical/visual properties.
- SetData remains the source-content contract.
- Renderer consumes scene values from SetRender and object Visual values from composed SetLang nodes.
- AggregateActivePanel visual inheritance from ActivePanel is an object-language rule.

This supersedes the experimental SetRender object inheritance and all prior SetRender.Elements bindings.
