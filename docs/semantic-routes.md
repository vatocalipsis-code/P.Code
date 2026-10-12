# Semantic routes

The `pcode.semantic-routes.v1` capability requires `pcode.semantic-model.v1`.
Each participating BasePanel declares a `Properties.Route` map. The browser
renderer owns visibility, history layers, inert state, dialog semantics,
transitions, dismissal listeners, gestures and their loading indicator.

The application publishes an ordinary semantic model, for example:

```json
{"location":{"id":"detail","history":["home","list"],"direction":"return","revision":4},"allowed":true,"canReturn":true}
```

Route IDs and command tokens are opaque. History describes application navigation;
it does not choose which history entries should be visible. `Mode = "Replace"`
shows the selected route alone. `Mode = "Stack"` presents the authored history
layers. Only SPL chooses that policy. Missing model/unknown route means none of
the managed panels is shown. Modal BasePanels use their separate modal contract.

Required route properties are `Id`, semantic `Source`, and `Mode`. Optional
`EnabledSource` gates interactive presentation; `DismissEnabledSource` gates
dismissal. `Dismiss` emits an ordinary `OffPress` event. `Escape` and `Outside`
(`Dismiss` or `Consume`) are presentation policy. CSS class names, transition
speed/acceleration, exclusion selectors and gesture regions are authored in SPL,
never inferred from application names or route names.

`Gestures` declares Back/Menu/Refresh commands, semantic availability and loading
sources, normalized starting regions, swipe thresholds, excluded controls and
indicator presentation. The runtime never performs refreshes, saves, permission
checks or navigation itself. It emits commands; the application can accept them,
reject them, or request confirmation and publish new state.

The renderer retains listeners and animations per mounted root, cancels them on
replacement/disposal and skips route recomposition when the navigation snapshot
is unchanged. Reduced-motion preferences disable slide animations.

SPL parsing/serialization preserves these structured declarations. Invalid maps,
duplicate identities, unknown properties and unnegotiated capabilities fail
validation before mounting.
