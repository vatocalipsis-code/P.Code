# P.Code 2.12.0

Status: local candidate.

## Layout contract

- `Height = Auto` lets authored panels, Groups, Containers, and EditableInputs grow with content.
- `MinHeight` and `MinWidth` set lower bounds without forcing a fixed size.
- `Container.TextOverflow` selects `Ellipsis`, `Wrap`, or `Clip`. Existing constrained containers retain their ellipsis behavior when the property is absent.
- SetData replacement reapplies text layout to newly created source nodes.

The SetLang, SetData, and SetRender envelopes remain version 1. Previous SPL files remain valid. U.Cash journal rows in both skins now use content-sized height with a 60 px minimum. No business or stored-data format changed.
