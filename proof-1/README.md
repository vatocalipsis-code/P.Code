# PlaneCode Proof-1

Goal: prove the minimum executable rendering chain.

Structure:

```text
BasePanel
└── SimplePanel
    └── ActivePanel
        └── Container: Text
```

Inputs:
- `plane-code.js` — structure
- `set-data.js` — displayed data
- `set-render.js` — rendering parameters

Executor:
- `web-renderer.js`

Expected visible result:
- one SimplePanel
- one nested ActivePanel
- text: `PlaneCode Proof-1`

Excluded from Proof-1:
- 3D
- validation
- events
- swipe
- application-specific logic
