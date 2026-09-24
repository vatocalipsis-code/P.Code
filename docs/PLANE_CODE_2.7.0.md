# PlaneCode 2.7.0

Status: CURRENT

Runtime execution model:

- SetLang is static input. It is compiled once into an immutable Object Plan.
- Runtime SetData changes patch only the already-bound Container data slots.
- SetData patching does not parse, traverse, compose or recompile SetLang.
- SetRender remains scene/global only.
- WebRenderer mounts the precompiled Object Plan and executes scene rendering; it does not resolve object inheritance or Login-based render rules.
- A SetLang change requires a new Object Plan compilation. This is outside the hot SetData path.

This release does not change the unresolved PLang hierarchy questions about direct SimplePanel -> Container or visual-only empty Containers.
