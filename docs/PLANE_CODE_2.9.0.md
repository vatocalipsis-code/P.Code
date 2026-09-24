# PlaneCode 2.9.0

Status: CURRENT

SetLang uses a fully typed three-layer panel model. There are exactly three physical panel layers: BasePanel, SimplePanel, ActivePanel.

- BasePanel: `Properties`, `Containers`, `SimplePanels`.
- SimplePanel: `Properties`, `Containers`, `ActivePanels`.
- ActivePanel: `Properties`, `Containers`.
- Container: `Properties`.
- AggregateActivePanel is a special ActivePanel, not a fourth layer. A SimplePanel may own 0..1 AggregateActivePanel through `Properties.AggregateActivePanels`; it renders on the ActivePanel physical layer and may be disabled with `Visible = "No"`.

Generic SetLang `children[]` is removed. The compiler alone may flatten the typed SetLang model into an immutable internal Object Plan for rendering.
