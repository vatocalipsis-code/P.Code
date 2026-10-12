# SPL numeric editor

Capability: `pcode.numeric-editor.v1` (Picot 2.21). Requires semantic-model and editable-input capabilities for decimal fields.

A single BasePanel may declare `NumericEditor`. It owns the dialog, navigation, key labels, button/output classes, pointer cancellation distance, input length and feedback duration. Styling stays in the skin stylesheet. No application callbacks receive DOM nodes or transient input buffers.

An EditableInput declares `DecimalInput { Precision = 2 }`, optionally `PrecisionSource` and `ReadOnlySource` with semantic paths. Other fields retain their native keyboard. The runtime never infers precision or eligibility from a Login, class, currency or operation name. Disabled controls and calculated/read-only values cannot open or commit the editor. A precision change while open cancels the transient buffer.

`EnabledSource`, `NavigationSource` and `HapticSource` in the scene select semantic state. The scene closes on navigation identity change, disabled session, removed field or runtime disposal. Gesture handling defers while the transient editor is open. A temporarily inert parent (for example, a help dialog) suspends interaction without discarding the buffer during background model updates. Escape, Back and outside pointer release cancel without committing. Enter on a supported input opens the editor. Submit emits the field's existing `OnInput` value event, preserving repeated ItemId through the normal input renderer.

The only scene command is `Help`: its value is an opaque SPL-authored application command. All display strings are SPL parameters. Decimal digits remain strings (no floating-point coercion); only the submitted separator is normalized to `.`.

`RuntimeHandle.consumeBack()` returns a boolean synchronously. An active runtime can consume Back for transient presentation navigation; otherwise the application performs its semantic route action. It does not reveal which visual component consumed the action. Inactive/disposed runtimes return false.

Event listeners are lifecycle-bound with AbortController. One delegated handler set per configured runtime; no application-wide field scan, observer or interval is needed. The existing native-control patch and semantic-model update carry field state.

## Decimal preview (2.22)

Capability `pcode.decimal-preview.v1` adds optional `DecimalInput.Preview`.
`Class`, `HostClass`, `ProjectedClass`, `NumberClass` and `FractionClass` are
skin-owned single CSS classes. `GroupSeparator` and `DecimalSeparator` are
explicit strings of at most one character. `Rounding = "HalfTowardZero"` selects
exact decimal display rounding; the native field value is never changed.

Picot creates an aria-hidden projection for an unfocused valid number. Focus
restores the native field; input, blur, precision/model updates and resize refresh
the projection. Formatting uses integer arithmetic and supports the field's
0–24 digit precision. The host passes no DOM node or formatted fragment.

One ResizeObserver and one frame scheduler per declared scene coalesce updates.
Text nodes are replaced only when their formatted content changes. Geometry is
read before positioning writes. Inputs removed by repeated-record reconciliation
are unobserved; root replacement/disposal cancels listeners, observers, queued
frames and removes projection nodes. Scenes without Preview allocate none of
these resources. Semantic `StateSource` and the skin stylesheet own color.
