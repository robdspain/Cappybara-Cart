# 13 — Content Pipeline & Formats
**Assets:** glTF + KTX2; JSON sidecars for gameplay

## Track JSON Schema
```json
{
  "name":"Sunny",
  "spline":[[0,0,0],[...]],
  "checkpoints":[{"p":[0,0,0],"w":8.0}],
  "surfaces":[{"type":"mud","box":[...]}],
  "pads":[{"pos":[...],"dir":[...]}],
  "items":[{"pos":[...]}]
}
```

**Tuning JSONs:** `/content/weights.json`, `/content/dda.json` (hot-reload)
