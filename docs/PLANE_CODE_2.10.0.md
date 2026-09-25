# P.Code 2.10.0

Status: target-generation implementation on feature/container-layout-trial.

Canonical descriptor:

- ComponentVersion: 2.10.0
- GenerationId: pcode.layout-group.v1
- SupportedSerializationVersions: 1
- Capabilities: none

This release adds the frozen Public Runtime API v1 boundary, lifecycle and connection isolation, complete Set-envelope validation, fail-stop renderer handling, semantic pointer events, hot full-SetData replacement without SetLang recompilation, contract tests, and the packaged PNG client demonstrator.

The recursive Group plus ordered Layout model is unchanged. SetLang owns structure and object visuals, SetData owns visible values and SourcePicture bindings, and SetRender owns scene values. P.Code does not resolve UI package assets and does not acquire product state; those remain Host responsibilities.
