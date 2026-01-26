# Interactive 3D Lanyard Example

An interactive 3D lanyard component built with React Three Fiber, Rapier physics, and Three.js. Drag the lanyard card to see realistic physics-based movement and interaction.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Basic Usage

The lanyard component can be imported and used directly:

```tsx
import Lanyard from "@/components/lanyard";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-neutral-900">
      <Lanyard />
    </div>
  );
}
```

### Customizing Physics Behavior

The `Band` component accepts two props to control physics behavior:

```tsx
<Lanyard maxSpeed={50} minSpeed={10} />
```

- **`maxSpeed`** (default: `50`): Maximum interpolation speed when the lanyard is moving quickly
- **`minSpeed`** (default: `10`): Minimum interpolation speed when the lanyard is moving slowly

These values control how smoothly the lanyard segments interpolate between positions. Higher values make the lanyard respond faster, lower values make it more sluggish.

## Customization Guide

### 1. Replacing the 3D Model (Card/Tag)

The lanyard uses a GLTF model located at `/public/tag.glb`. The model must contain three meshes named `card`, `clip`, and `clamp` for proper rendering.

**Option A: Editing the Existing Model**

1. **Open the model** in a GLTF editor:
   - [glTF Editor](https://www.gltfeditor.com/) (web-based, no installation)
   - [Blender](https://www.blender.org/) with glTF import/export addon (more advanced)

2. **Extract and edit the texture**:
   - Locate the `card` mesh in the scene hierarchy
   - Find the material assigned to the card (usually under the `Base` or `BaseColor` property)
   - Export/download the texture image (typically PNG or JPG)
   - Edit the texture in an image editor (Photoshop, GIMP, Figma, etc.)
   - Maintain the same dimensions or use power-of-2 dimensions (500x500, 1000x1000, 2000x2000, etc.) for best performance

3. **Re-apply the texture**:
   - Import your edited texture back into the GLTF editor
   - Assign it to the card material's base color/texture slot
   - Ensure the texture is properly mapped to the card geometry

4. **Export and replace**:
   - Export the model as a `.glb` file (binary GLTF format)
   - Replace `/public/tag.glb` with your new file
   - Restart the development server to see changes

**Option B: Using a Completely New Model**

1. Create or obtain a GLTF model with three meshes named exactly: `card`, `clip`, and `clamp`
2. Ensure the `card` mesh is positioned and scaled appropriately (the component scales it by 2.25x)
3. Place the model at `/public/tag.glb` (or update the path in `lanyard.tsx` line 27 and 76)

**Important Notes:**
- The model must be in GLB format (binary GLTF)
- Mesh names are case-sensitive and must match exactly
- The card texture supports anisotropy filtering (16x) for better quality
- If your model uses different mesh names, update the code in `lanyard.tsx` accordingly

### 2. Customizing the Lanyard Texture

The lanyard band texture is located at `/public/lanyard.png` and repeats along the band length.

**To customize:**

1. **Edit the texture**:
   - Open `/public/lanyard.png` in an image editor
   - The texture will tile horizontally along the lanyard band
   - Recommended dimensions: power-of-2 (e.g., 256x64, 512x128) for optimal performance
   - Consider creating a seamless pattern for smooth tiling

2. **Replace the file**:
   - Save your edited image as `lanyard.png` in the `/public` directory
   - Or save with a new name and update the code references (see below)

3. **Update code references** (if using a different filename):
   - Update the preload path in `lanyard.tsx` line 28:
     ```tsx
     useTexture.preload("/your-texture.png");
     ```
   - Update the texture usage in `lanyard.tsx` line 77:
     ```tsx
     const texture = useTexture("/your-texture.png");
     ```

4. **Adjust tiling** (optional):
   - Modify the `repeat` property in `meshLineMaterial` (line 287) to change how the texture tiles:
     ```tsx
     repeat={new THREE.Vector2(-3, 1)} // Horizontal repeats, Vertical repeats
     ```
   - Negative horizontal values flip the texture direction
   - Increase values for more repetitions, decrease for fewer

5. **Refresh the page** to see your changes


### 3. Customizing Colors

#### Lanyard Band Color

Change the band color in the `meshLineMaterial`:

```tsx
<meshLineMaterial
  color="white"  // Change to any CSS color: "#ff0000", "rgb(255,0,0)", etc.
  // ... other props
/>
```

#### Card Material Properties

Customize the card's appearance:

```tsx
<meshPhysicalMaterial
  clearcoat={0.5}              // Shine/glossiness (0-1)
  clearcoatRoughness={0.3}      // Roughness of the shine (0-1)
  metalness={1}                 // Metallic appearance (0-1)
  roughness={0.5}               // Surface roughness (0-1)
  // ... other props
/>
```

#### Clip and Clamp Colors

Change the clip/clamp (attachment hardware) colors:

```tsx
<meshPhysicalMaterial
  color="black"                 // Change to any color
  metalness={1}
  reflectivity={0.5}
  roughness={0.5}
/>
```

### 4. Adjusting Physics Parameters

#### Gravity

Change the gravity strength in the `Physics` component:

```tsx
<Physics gravity={[0, -40, 0]} interpolate timeStep={1 / 60}>
```

- First value: X-axis gravity (left/right)
- Second value: Y-axis gravity (up/down, negative = down)
- Third value: Z-axis gravity (forward/back)

#### Damping

Control how quickly objects slow down:

```tsx
const segmentProps = {
  angularDamping: 2,  // Rotational damping (higher = slower rotation)
  linearDamping: 2,  // Linear damping (higher = slower movement)
  // ... other props
};
```

#### Collider Sizes

Adjust collision detection:

```tsx
// For the card:
<CuboidCollider args={[0.8, 1.125, 0.01]} />  // Width, Height, Depth

// For joints:
<BallCollider args={[0.1]} />  // Radius
```

### 5. Camera and Lighting

#### Camera Position

Adjust the camera in the `Canvas` component:

```tsx
<Canvas camera={{ position: [0, 0, 10], fov: 25 }}>
```

- `position`: [x, y, z] camera position
- `fov`: Field of view (degrees)

#### Lighting

Customize ambient and directional lights:

```tsx
<ambientLight intensity={1} />
<directionalLight intensity={3} position={[5, 5, 5]} />
<directionalLight intensity={3} position={[-5, 3, 3]} />
```

- `intensity`: Light brightness (0-1 or higher)
- `position`: [x, y, z] light position

### 6. Lanyard Length and Position

#### Initial Position

Change where the lanyard starts:

```tsx
<group position={[0, 4, 0]}>  // [x, y, z] position
```

#### Joint Positions

Adjust the spacing between joints:

```tsx
<RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
<RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
<RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
<RigidBody position={[2, 0, 0]} ref={card} {...segmentProps}>
```

#### Rope Joint Length

Control the distance between segments:

```tsx
useRopeJoint(
  fixed as RefObject<RapierRigidBody>,
  j1 as RefObject<RapierRigidBody>,
  [[0, 0, 0], [0, 0, 0], 1]  // Last value is the rope length
);
```

### 7. Card Scale and Position

Adjust the card size and attachment point:

```tsx
<group
  position={[0, -1.25, -0.05]}  // Position relative to joint
  scale={2.25}                    // Scale multiplier
>
```

### 8. Line Width and Resolution

The lanyard band line width automatically scales with viewport size. To customize:

```tsx
const lineWidth = useMemo(() => {
  const baseWidth = 10;
  const baseLineWidth = 1;  // Adjust this value
  const scale = Math.max(1, baseWidth / Math.max(viewport.width, 3));
  return baseLineWidth * scale;
}, [viewport.width]);
```

Adjust resolution for better quality:

```tsx
<meshLineMaterial
  resolution={new THREE.Vector2(2, 1)}  // Higher = better quality
  // ... other props
/>
```

## Advanced Customization

### Adding Multiple Lanyards

You can render multiple lanyards by creating multiple `Band` components:

```tsx
<Physics gravity={[0, -40, 0]} interpolate timeStep={1 / 60}>
  <Band maxSpeed={50} minSpeed={10} />
  <Band maxSpeed={50} minSpeed={10} />
</Physics>
```

Note: You'll need to adjust positions and refs to avoid conflicts.

### Custom Interaction Behavior

Modify the drag interaction in the `onPointerDown` handler:

```tsx
onPointerDown={(e) => {
  // Custom interaction logic here
  (e.target as Element)?.setPointerCapture(e.pointerId);
  // ... existing code
}}
```

### Adding Constraints

Add additional physics constraints by using more Rapier joints:

```tsx
import { useFixedJoint, useRevoluteJoint } from "@react-three/rapier";
```

## Project Structure

```
├── app/
│   ├── page.tsx          # Main page component
│   └── layout.tsx        # Root layout
├── components/
│   └── lanyard.tsx       # Main lanyard component
└── public/
    ├── tag.glb           # 3D card/tag model
    └── lanyard.png       # Lanyard texture
```

## Dependencies

- **@react-three/fiber**: React renderer for Three.js
- **@react-three/rapier**: Physics engine integration
- **@react-three/drei**: Useful helpers for React Three Fiber
- **meshline**: For rendering the lanyard band
- **three**: 3D graphics library

## Troubleshooting

### Model Not Loading
- Ensure the GLB file is in `/public` directory
- Check that the file path matches exactly (case-sensitive)
- Verify the model contains the expected mesh names (`card`, `clip`, `clamp`)

### Texture Not Appearing
- Ensure the texture file is in `/public` directory
- Check file format (PNG recommended)
- Verify `useMap={1}` is set in `meshLineMaterial`

### Physics Issues
- Adjust damping values if movement is too bouncy or sluggish
- Check collider sizes match your model dimensions
- Verify gravity direction matches your scene orientation