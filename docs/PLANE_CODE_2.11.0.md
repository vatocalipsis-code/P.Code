# P.Code 2.11.0

Status: release candidate.

## Release identity

- ComponentVersion: `2.11.0`
- GenerationId: `pcode.layout-group.v1`
- SupportedSerializationVersions: `1`
- Optional capability: `pcode.editable-input.v1`
- Package version: `2.11.0`

The historical filename prefix `PLANE_CODE_` is retained for release-record continuity. The current project name is P.Code.

## Contract delta

2.11.0 consolidates the already implemented and verified target generation:

- ordered `Layout[]` with recursive invisible `Group` nodes;
- legacy `Containers[]` input compatibility;
- frozen Public Runtime API v1 lifecycle and connection isolation;
- full SetData replacement without SetLang recompilation;
- negotiated editable input capability v1 and value-bearing input events;
- optional top-level Resources v1 packaging, which remains outside the three Set objects;
- up to two embedded WOFF2 font resources;
- embedded PNG picture resources;
- `Container.Font = "<resource-name>"`;
- `SourcePicture = "res:<picture-resource-name>"`;
- Theme/Skin Editor authoring workflow, including self-contained SPL save/export and live visual controls.

## Compatibility

SPL without Resources remains valid. Missing packaged resource references fail validation rather than falling back silently.

PLang / SetLang, SetData, SetRender, Resources packaging, and Renderer remain separate responsibilities. Resources does not become a Set. No Cash-specific business semantics are part of P.Code.

## Release-candidate verification target

The release candidate must keep the existing runtime/editor test suite green, verify embedded WOFF2 and PNG rendering, preserve editable-input negotiation, preserve legacy SPL acceptance, and pass the repository's existing Pages/editor packaging path before promotion.
