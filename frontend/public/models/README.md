# Avatar models

Drop a GLB rigged with ARKit / Oculus viseme (blendshape / morph-target) names
here as `avatar.glb`, then:

1. Set `VITE_AVATAR_URL=/models/avatar.glb` in `frontend/.env`.
2. In `src/components/AvatarCanvas.tsx`, uncomment the `GltfAvatar` import,
   the `AVATAR_URL` constant, and the `<GltfAvatar .../>` line, and remove the
   procedural `<Avatar .../>`.

The app runs without any model — a procedural placeholder head is rendered by
default so lip-sync is visible out of the box.
