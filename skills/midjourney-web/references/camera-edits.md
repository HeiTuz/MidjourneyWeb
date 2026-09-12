# Camera direction and viewpoint edits

The [Edit Model](https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model) explicitly supports changing perspective (official article rechecked 2026-09-13). This is generative reconstruction from references, not a calibrated 3D camera or proof of unseen geometry.

## Choose the operation

| Requested change | Starting tool |
|---|---|
| See the same scene from the side, behind, above, or another shoulder | Edit reference with written viewpoint instructions |
| Crop, reposition or resize within the same perspective | Editor Move/Resize/canvas controls |
| Reveal more area outside the existing frame | Editor canvas expansion/outpainting or compatible reframe tool |
| Change one object while holding the camera fixed | Masked Editor or a targeted semantic edit |
| Move a camera over time | Video, only when animation is requested |

Do not interpret a flat layer rotation as orbiting around the subject. A camera move changes occlusion and perspective across the scene; a face-only turn, horizontal flip or tighter crop is not sufficient.

## Write a testable instruction

Specify the viewer's new position, what should now be visible, the subject's unchanged pose/action, and the visual features to preserve. Avoid ambiguous left/right instructions without a frame of reference. Approximate angles can communicate intent but must not be reported as measured results.

Example pattern (attach the selected original as an Edit reference):

```text
Show this scene from behind the subject's right shoulder, looking past the subject toward the same window. Keep the subject facing the window in the same pose. Show the back of the head and jacket in the foreground; update the window and background perspective consistently. Preserve the clothing, objects, lighting and painted treatment. Keep the same shot size.
```

Use [Create](create.md) for compatible parameters and reference order. Keep profile/style inputs constant when comparing camera instructions. A new angle necessarily changes visible geometry; preserve design and scene continuity rather than demanding identical pixels or identical screen positions.

## Compare without compounding drift

Start each independent camera variant from the same original. Do not turn the first generated angle into the next angle's source unless a sequential edit is requested. A single approved batch tests one instruction; more angles or retries require remaining authorized scope.

Review every returned candidate for: actual viewpoint change; subject orientation versus viewer motion; foreground/background occlusion; identity and object design; rendering style; hands and prop interactions. Mark hidden features as unassessable. Newly revealed details are inferred, not recovered facts. Save original and candidate files with exact job/index and input settings in the private task record.

Live findings belong in [evidence.md](evidence.md); do not promote this general procedure to a claim that every camera angle or Editor operation has passed testing.
