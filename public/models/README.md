# /public/models: drop-in 3D models

Drop Meshy (or Blender) exports here as **binary glTF (.glb)**. Each one is optional:
if a file is missing, or fails to load, the site uses its procedural placeholder.
File presence is checked on the server (`src/lib/models.server.ts`), so after adding a file,
refresh in dev or redeploy.

| File | Node names the code looks for | Notes |
|------|-------------------------------|-------|
| `satellite.glb` | `body`, `panel_left`, `panel_right`, `dish`, `antenna`, `arm_left`, `arm_right`, `thruster` | Export **assembled**: every piece in its final position, each one a separate top-level object. The code scatters the pieces and reassembles them as you scroll. 6–8 pieces is fine; if none of the names match, the top-level children are used as the pieces. |
| `spinner.glb` | `spinner_rotor`, `spinner_core` | Lying flat, spin axis = +Y (up). `spinner_rotor` = arms + weights (the part that spins), origin at the centre. `spinner_core` = centre cap (optional). |
| `envelope.glb` | `envelope_body`, `envelope_flap`, `envelope_seal` | Facing front (+Z), flap closed. The **origin/pivot of `envelope_flap` must sit on the hinge** (top edge) so it rotates open around X. `envelope_seal` (wax seal) is optional. |
| `question-stone.glb` | `stone_01` … `stone_08` (optional) | Small stone that sits inside each ice crystal. Provide one stone (any name, reused for all 8) or `stone_01`…`stone_08` for one per question. |
| `debris.glb` | `debris_01` … `debris_06` | Small floating fragments along the path. Any number of top-level objects works. |

Tips:
- Name objects in Blender exactly as above (glTF turns spaces into underscores).
- Models are auto-centred and auto-scaled, so the export scale doesn't matter.
- Keep each file under ~2 MB (decimate to roughly 5–20k triangles, textures ≤ 1024px).
- Draco-compressed files work, but the decoder is then fetched from Google's CDN (gstatic).
