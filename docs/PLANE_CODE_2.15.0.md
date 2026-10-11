# P.Code 2.15.0 local candidate

Adds the negotiated `pcode.tilt-parallax.v1` scene signal for skins that want
depth driven by device orientation. `SetRender.Data.TiltParallax` bounds the
offset and smoothing. Permission is requested only through an explicit
`RuntimeHandle.requestTilt()` user action; `disableTilt()` and disposal clean up
listeners and CSS variables. The previous pointer `pcode.parallax.v1` keeps its
existing semantics. The renderer contains no application or skin names.
