# GeoAgent Solution Studio Assets

This folder contains the local asset pack extracted or redrawn from the three Solution Studio design boards.

## Contents

- `boards/`: original full PNG design boards.
- `raster/`: page-level crops used as visual references or temporary preview imagery.
- `icons/geoagent-logo.svg`: local GeoAgent brand mark.
- `icons/solution-studio-icons.svg`: SVG symbol sprite for navigation, delivery stages, files, and status icons.
- `design-tokens.json`: brand names and color tokens from the selected design direction.
- `assets-manifest.json`: stable paths for implementation.

## Notes

The source design boards are flat generated PNG images, not layered Figma files. The raster assets are cropped from those boards, while the SVG icons are locally redrawn in the same visual language so they can be themed with `currentColor`.

Suggested sprite usage:

```tsx
<svg aria-hidden="true">
  <use href="/src/assets/solution-studio/icons/solution-studio-icons.svg#ss-dashboard" />
</svg>
```
