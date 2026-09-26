export const NUMERIC_CONTROL_SPECS = Object.freeze({
  BorderWidth: { min: 0, max: 32, step: 1 },
  BorderLeftWidth: { min: 0, max: 32, step: 1 },
  BorderRightWidth: { min: 0, max: 32, step: 1 },
  BorderTopWidth: { min: 0, max: 32, step: 1 },
  BorderBottomWidth: { min: 0, max: 32, step: 1 },
  Width: { min: 0, max: 1200, step: 1 },
  Height: { min: 0, max: 1200, step: 1 },
  Padding: { min: 0, max: 128, step: 1 },
  Gap: { min: 0, max: 128, step: 1 },
  FontSize: { min: 1, max: 128, step: 1 },
  FontWeight: { min: 1, max: 1000, step: 1 },
  Parallax: { min: -64, max: 64, step: 0.5 },
  PanelTransparency: { min: 0, max: 1, step: 0.01 },
  Shadow: { min: 0, max: 64, step: 0.5 },
  PanelSpacing: { min: 0, max: 128, step: 1 },
  Transparency: { min: 0, max: 1, step: 0.01 },
  TextTransparency: { min: 0, max: 1, step: 0.01 },
  PictureTransparency: { min: 0, max: 1, step: 0.01 }
});

export function sliderSpecFor(key, value = 0) {
  const base = NUMERIC_CONTROL_SPECS[key] ?? { min: 0, max: 100, step: 1 };
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return {
    ...base,
    min: Math.min(base.min, numeric),
    max: Math.max(base.max, numeric)
  };
}
