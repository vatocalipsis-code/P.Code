# SetRender Canon

Status: CURRENT

SetRender is the independent **scene render contract** of PlaneCode.

SetRender describes only the global render environment of the scene. It MUST NOT address, identify, inspect, style, size or otherwise describe individual PLang objects. SetRender contains no Login bindings, no `Elements`, and no object `Types`.

## Scene properties

```text
PanelSpacing
BackgroundColor
PanelColor
BorderColor
TextColor
Transparency
TextTransparency
PictureTransparency
Parallax
```

These values are scene/global defaults only. They do not identify an object. Transparency values are 0..1. Parallax is a signed finite scene value; zero disables it.

Any property that describes a concrete interface object belongs to SetLang, not SetRender.
