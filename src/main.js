import './assets/styles.css'; // Adjust the path as necessary
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as dat from 'lil-gui'
// --------------------------------------------------------------------------------[Scene Setup]
const scene = new THREE.Scene();

// --------------------------------------------------------------------------------[Camera Setup]
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(20, 120, 40);


// --------------------------------------------------------------------------------[Renderer Setup]
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --------------------------------------------------------------------------------[Lighting Setup]
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xe0fbff); // Soft white light
scene.add(ambientLight);

// --------------------------------------------------------------------------------[OrbitControls Setup]
// --------------------------------------------------------------------------------[OrbitControls Setup]
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.minDistance = -19;    // Set the minimum zoom distance
controls.maxDistance = 300;   // Set the maximum zoom distance

// --------------------------------------------------------------------------------[Shader Material for the Flag]
const textureLoader = new THREE.TextureLoader();

const flagVertexShader = `
  uniform float time;
  uniform float freqX;
  uniform float freqY;
  varying vec2 vUv; // To pass UV coordinates to the fragment shader
  
  void main() {
    vec3 newPosition = position;
    
    // Waving flag effect with sine functions based on time and frequencies
   newPosition.y += sin(newPosition.x * freqX + time + 0.5) * 0.5; // X-axis wave with shifted position
newPosition.z += sin(newPosition.y * freqY + time + 0.5) * 0.5; // Y-axis wave with shifted position

    
    vUv = uv; // Pass the UV coordinates to fragment shader
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const flagFragmentShader = `
  uniform sampler2D flagTexture; // Uniform for the texture
  varying vec2 vUv; // UV coordinates passed from the vertex shader
  
  void main() {
    // Use the texture based on the UV coordinates
    gl_FragColor = texture2D(flagTexture, vUv);
  }
`;

// --------------------------------------------------------------------------------[Texture Loading]
const flagTexture = textureLoader.load('/images/textures/spicy.jpg'); // Path to your flag image

// --------------------------------------------------------------------------------[Create flag material with texture]
const flagMaterial = new THREE.ShaderMaterial({
  vertexShader: flagVertexShader,
  fragmentShader: flagFragmentShader,
  uniforms: {
    time: { value: 0 }, // Time variable to animate the flag
    freqX: { value: 0.5 }, // Frequency X
    freqY: { value: 0.6 }, // Frequency Y
    flagTexture: { value: flagTexture }, // Set the flag texture uniform
    lightPosition: { value: directionalLight.position }, // Pass light position for lighting calculation
    roughness: { value: 0 } // Add roughness uniform with a default value
  },
  side: THREE.DoubleSide,
  wireframe: false,
});

// --------------------------------------------------------------------------------[Plane Geometry for Flag]
const geometry = new THREE.PlaneGeometry(14, 9, 50, 50); // High segments for smooth waving
const flag = new THREE.Mesh(geometry, flagMaterial);
flag.rotation.y = Math.PI / 1; // Rotate the flag to stand upright (rotate it around the Y-axis)
flag.position.set(63.4, 9.5, 0.2); // Position the flag above the ground
scene.add(flag);

// Set the flag to cast and receive shadows
flag.castShadow = true;  // Make the flag cast shadows
flag.receiveShadow = true; // Make the flag receive shadows

// --------------------------------------------------------------------------------[Flagpole (Cylinder) - Horizontal]
const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 16, 32); // Cylinder with a small diameter for the flagpole
const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xc7b28b }); // Brown color for the pole
const flagpole = new THREE.Mesh(poleGeometry, poleMaterial);

// Position the flagpole next to the flag
flagpole.scale.set(2,2,2);
flagpole.position.set(70, -1, 0); // Adjust the flagpole position to attach to the flag
flagpole.rotation.x = Math.PI / 1; // Rotate the pole around the x-axis to make it horizontal
scene.add(flagpole);

// Set the flagpole to cast and receive shadows
flagpole.castShadow = true;  // Make the flagpole cast shadows
flagpole.receiveShadow = true; // Make the flagpole receive shadows

// --------------------------------------------------------------------------------[dat.GUI Controls for Frequencies]
const gui = new dat.GUI();
gui.close();  // This closes the GUI on page load
gui.add(flagMaterial.uniforms.freqX, 'value', 0, 5).name('Frequency X');



// --------------------------------------------------------------------------------[Window Resize Handling]
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});


// --------------------------------------------------------------------------------[Water Shader for Raging Sea]
// Vertex Shader for Water
const waterVertexShader = `
  uniform float time;
  varying vec2 vUv;
  varying float vWaveHeight;

  void main() {
    vUv = uv;

    // Increase wave height by changing amplitude
    float waveAmplitude = 6.0;  // Increase the wave height
    float waveFrequency = 0.1;  // Control wave frequency (lower = wider waves)

    // Create waving effect based on sine and cosine functions
    vec3 newPosition = position;
    float waveHeight = sin(position.x * waveFrequency + time * 1.5) * waveAmplitude + 
                       cos(position.z * waveFrequency + time * 1.5) * waveAmplitude;

    // Apply wave height to y position
    newPosition.y += waveHeight;

    vWaveHeight = waveHeight;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Fragment Shader for Water
const waterFragmentShader = `
  uniform float time;
  uniform sampler2D normalMap;  // Normal map for water
  uniform vec3 lightPosition;   // Light source position
  uniform vec3 waterColor;      // Single color for the water
  varying vec2 vUv;
  varying float vWaveHeight;

  void main() {
    // Sample normal map to get water surface normals
    vec3 normal = texture2D(normalMap, vUv).rgb;
    normal = normalize(normal * 2.0 - 1.0); // Convert normal to [-21,1] range

    // Light reflection and refraction based on wave surface
    vec3 lightDir = normalize(lightPosition - gl_FragCoord.xyz);
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Combine the water color with light and shadow effects
vec3 color = waterColor * diff * 0.8 + vec3(95.0/255.0, 156.0/255.0, 107.0/255.0) * (1.0 - diff);



    gl_FragColor = vec4(color, 0.5); // Set the alpha value for transparency (11 for semi-transparent)
  }
`;

// Load normal map texture for the water
const normalTexture = textureLoader.load('/images/textures/waterNormalMap.jpg'); // Adjust path to normal map

// Create the water material using the custom shader
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    time: { value: 0 },
    normalMap: { value: normalTexture },
    lightPosition: { value: directionalLight.position },
    waterColor: { value: new THREE.Color(0.4, 0.3, 0.3) }, // Set the water color (can change this to your desired color)
  },
  side: THREE.DoubleSide,
  transparent: true,  // Allow transparency for realistic water effects
  opacity: 0.7,       // Set opacity for transparency level
  wireframe: false,
  depthWrite: false,  // Disable depth writing to avoid visual artifacts with transparency
});

// Create the water mesh
const waterGeometry = new THREE.PlaneGeometry(900, 900, 512, 512);
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI * 0.5; // Rotate water to lie flat
water.position.set(0, -100, 0); // Position the water at the bottom
water.receiveShadow = true;  // Allow the water to receive shadows
scene.add(water);


// Define initial shader parameters
const shaderParams = {
  waterColor: [102, 77, 69], // RGB values for water color
  opacity: 0.7,
  time: 0,
  lightPosition: { x: 50, y: 50, z: 50 }, // Initial light position
};




gui.add(shaderParams, 'time', 0, 10).onChange((value) => {
  // Update the time uniform in the shader
  waterMaterial.uniforms.time.value = value;
});

gui.add(shaderParams.lightPosition, 'x', -100, 100).onChange((value) => {
  // Update the light position in the shader
  waterMaterial.uniforms.lightPosition.value.x = value;
});

gui.add(shaderParams.lightPosition, 'y', -100, 100).onChange((value) => {
  // Update the light position in the shader
  waterMaterial.uniforms.lightPosition.value.y = value;
});

gui.add(shaderParams.lightPosition, 'z', -100, 100).onChange((value) => {
  // Update the light position in the shader
  waterMaterial.uniforms.lightPosition.value.z = value;
});



// --------------------------------------------------------------------------------[SPEAKER]
// Load the texture for the speaker body
// Load the texture for the speaker body

const speakerTexture = textureLoader.load('/images/textures/speaker.png'); // Replace with the path to your image

// Create a material using the texture that supports lighting
// Create a material using the texture that supports lighting
const speakerMaterial = new THREE.MeshStandardMaterial({
  map: speakerTexture,  // Apply the texture
  roughness: 0,       // Adjust to make the surface rough (1.0 = fully rough, 0.0 = smooth)
  metalness: 0.2        // Adjust to make the surface metallic (1.0 = fully metallic, 0.0 = non-metallic)
});


// Create the cube geometry for the speaker
const speakerGeometry = new THREE.BoxGeometry(70, 70, 70); // A simple cube shape

// Create the speaker mesh
const speakerMesh = new THREE.Mesh(speakerGeometry, speakerMaterial);

// Enable shadow casting and receiving for the speaker mesh
speakerMesh.castShadow = true; // Allow the mesh to cast shadows
speakerMesh.receiveShadow = true; // Allow the mesh to receive shadows

// Set the position of the speaker mesh
speakerMesh.position.set(190, -20, 125); // Adjust the position as needed

// Rotate the speaker mesh by 40 degrees around the y-axis and x-axis
speakerMesh.rotation.y = 40 * (Math.PI / 480); // Convert degrees to radians
speakerMesh.rotation.x = 40 * (Math.PI / 480); // Convert degrees to radians

// Add the speaker mesh to the scene
scene.add(speakerMesh);

// Make sure the renderer supports shadows
renderer.shadowMap.enabled = true;

// Add lights to the scene
const pointLight = new THREE.PointLight(0xffffff, 1); // A white point light
pointLight.position.set(100, 200, 100); // Adjust the position as needed
pointLight.castShadow = true; // Enable shadow casting for the light
scene.add(pointLight);



// Create a PlaneGeometry (a simple flat plane) for the speaker front (where the pattern will be applied)
const patternGeometry = new THREE.PlaneGeometry(60, 60, 60);

// Vertex Shader: Basic shader code that passes UVs from vertex to fragment shader
const patternVertexShader = `
  varying vec2 vUv; // The varying variable to pass UV coordinates to the fragment shader

  void main() {
    vUv = uv; // Pass UV coordinates directly from the geometry to the fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader: Neon grid pattern with dynamic effects
const patternFragmentShader = `
  varying vec2 vUv;  // The UV coordinates passed from the vertex shader

  void main() {
    // Create a grid pattern by using modular arithmetic
    float gridSize = 10.0;  // Adjust grid size
    float lineThickness = 0.05;  // Thickness of the grid lines
    
    // Calculate horizontal and vertical lines
    float horizontalLine = step(0.5, mod(vUv.y * gridSize, 1.0)); // Horizontal lines
    float verticalLine = step(0.5, mod(vUv.x * gridSize, 1.0));   // Vertical lines

    // Combine the horizontal and vertical lines to create a grid
    float grid = horizontalLine * verticalLine;
    
    // Apply sine wave for dynamic oscillation (this gives a pulsing grid effect)
    float strength = sin(vUv.x * 10.0) * sin(vUv.y * 10.0);
    
    // Apply neon-like colors for grid lines
    vec3 neonColor1 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 neonColor2 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 mixedColor = mix(neonColor1, neonColor2, strength * 0.5 + 0.5); // Mix colors based on strength

    // Amplify glow effect for grid lines
    mixedColor *= 1.5 + 0.5 * sin(strength * 10.0); // Glow effect

    // Apply transparency and pulsating effect
    float alpha = 0.5 + 0.5 * sin(strength * 5.0); // Pulsating transparency

    // Final color output with grid lines and neon glow effect
    gl_FragColor = vec4(mixedColor * grid, alpha); // Apply grid and color
  }
`;

// ShaderMaterial: Set up custom material with the shaders
const patternMaterial = new THREE.ShaderMaterial({
  vertexShader: patternVertexShader,
  fragmentShader: patternFragmentShader,
  transparent: true,  // Enable transparency for glowing effect
  blending: THREE.AdditiveBlending, // Optional: Makes the colors blend nicely
  depthWrite: true,   // Ensure depth is written for transparency
  depthTest: true,    // Enable depth testing for proper rendering
  side: THREE.DoubleSide, // Render both sides of the geometry (useful for complex 3D shapes)
});

// Create the pattern mesh and add it to the scene for the speaker front
const patternMesh = new THREE.Mesh(patternGeometry, patternMaterial);

// Position the pattern in front of the cube to represent the speaker grill
patternMesh.position.set(154, -20, 134); // Adjust the Z position so it's in front of the cube
patternMesh.rotation.y = 40 * (Math.PI / 70); // Convert degrees to radians
patternMesh.rotation.x = 40 * (Math.PI / 450); // Convert degrees to radians

scene.add(patternMesh);


//sea



// --------------------------------------------------------------------------------[Background Setup]

const texture = textureLoader.load('/images/bg/metal.webp'); // Replace with your image path

const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
const sphereMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.BackSide, // Make the texture visible from the inside
});
const backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(backgroundSphere);

// --------------------------------------------------------------------------------[Light Controls with dat.GUI]
gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('Light Intensity');
gui.add(directionalLight.position, 'x').min(-10).max(10).step(0.001).name('Light X');
gui.add(directionalLight.position, 'y').min(-10).max(10).step(0.001).name('Light Y');
gui.add(directionalLight.position, 'z').min(-10).max(10).step(0.001).name('Light Z');

// --------------------------------------------------------------------------------[Burger Model Loading]

const loader = new GLTFLoader();

loader.load(
  '/images/models/burger_lowpoly.glb',
  (gltf) => {
    const burger = gltf.scene;

    burger.scale.set(200, 200, 200);
    burger.position.set(100, -100, 3);

    burger.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.metalness = 0.1;
          node.material.roughness = 0;
        }
      }
    });

    scene.add(burger);
  },
  undefined,
  (error) => {
    console.error('Error loading burger model:', error);
  }
);

// --------------------------------------------------------------------------------[Trash Model Loading]
loader.load(
  '/images/models/trash__garbage_002_3d_scan.glb',
  (gltf) => {
    const trash = gltf.scene;

    trash.scale.set(650, 650, 650);
    trash.position.set(-100, -10, 4);

    trash.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.metalness = 0.1;
          node.material.roughness = 0;
        }
      }
    });

    scene.add(trash);
  },
  undefined,
  (error) => {
    console.error('Error loading trash model:', error);
  }
);
// --------------------------------------------------------------------------------[DUST Model Creation]

let dustParticles = []; // Array to hold the particles
let dustGeometry = new THREE.BufferGeometry(); // Buffer geometry for particles
let dustMaterial = new THREE.PointsMaterial({
  color: 0xa39d83, // Dust color
  size: 0.5, // Size of each particle
  transparent: true,
  opacity: 0.7, // Adjust opacity to make it more like dust
});

const numDustParticles = 5000; // Increase number of particles
const dustAreaSize = 700; // Increase the area size for dust cloud

// Create random particles
const createDustParticles = () => {
  const positions = new Float32Array(numDustParticles * 3); // Particle positions
  const velocities = []; // Store velocity for each particle

  // Create positions and random velocities for each particle
  for (let i = 0; i < numDustParticles; i++) {
    const i3 = i * 3;
    // Increase the range of positions to make the cloud wider
    positions[i3] = Math.random() * dustAreaSize - dustAreaSize / 2; // Random x between -dustAreaSize/2 and dustAreaSize/2
    positions[i3 + 1] = Math.random() * dustAreaSize - dustAreaSize / 2; // Random y between -dustAreaSize/2 and dustAreaSize/2
    positions[i3 + 2] = Math.random() * dustAreaSize - dustAreaSize / 2; // Random z between -dustAreaSize/2 and dustAreaSize/2
    
    // Increase the range of velocity to spread particles more
    velocities.push({
      x: Math.random() * 0.2 - 0.1, // Random horizontal speed
      y: Math.random() * 0.2 - 0.1, // Random vertical speed
      z: Math.random() * 0.2 - 0.1, // Random depth speed
    });
  }

  // Set positions in buffer geometry
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Create a Points object for the particles
  const dustCloud = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dustCloud);

  // Store velocities for updating particle positions
  dustParticles = velocities;
};

// Update particle positions to make them move
const updateDustParticles = () => {
  if (dustParticles.length === 0) return;

  const positions = dustGeometry.attributes.position.array; // Get the position array from geometry

  for (let i = 0; i < numDustParticles; i++) {
    const i3 = i * 3;

    // Update the positions based on the velocity
    positions[i3] += dustParticles[i].x;
    positions[i3 + 1] += dustParticles[i].y;
    positions[i3 + 2] += dustParticles[i].z;

    // If particles move out of the scene, reset their position to random
    if (positions[i3] > dustAreaSize / 2 || positions[i3] < -dustAreaSize / 2) dustParticles[i].x *= -1;
    if (positions[i3 + 1] > dustAreaSize / 2 || positions[i3 + 1] < -dustAreaSize / 2) dustParticles[i].y *= -1;
    if (positions[i3 + 2] > dustAreaSize / 2 || positions[i3 + 2] < -dustAreaSize / 2) dustParticles[i].z *= -1;
  }

  // Notify Three.js that the positions array has been updated
  dustGeometry.attributes.position.needsUpdate = true;
};

// Call `createDustParticles()` to create the particles and `updateDustParticles()` in the animation loop
createDustParticles();




// --------------------------------------------------------------------------------[Fly Model Creation]
const mixers = []; // Store AnimationMixers for updates
const flies = []; // Store the fly objects

function createFly(radius = 50, angle = 100) {
  loader.load(
    '/images/models/fly/scene.gltf', // Path to your fly model
    (gltf) => {
      const fly = gltf.scene;
      fly.scale.set(6, 6, 6);  // Fixed scale
      fly.position.set(100, -13, radius * Math.sin(angle)); // Circular pattern

      fly.rotation.y = angle;  // Rotation based on position

      fly.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
        if (node.material) {
          node.material.metalness = 0.1; // Adjust material properties
          node.material.roughness = 0;
        }
      });

      scene.add(fly);
      flies.push(fly); // Store the fly
      

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(fly);
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });
        mixers.push(mixer); // Add mixer to the array for updates
      }
    },
    undefined,
    (error) => {
      console.error('Error loading fly model:', error);
    }
  );
  
}
  //-------------------------------------------------------------------GALAXYYYYY

// Create multiple flies in a circular pattern
const numFlies = 3;
const radius = 30;  // Adjust for more spacing
const angleIncrement = (5 * Math.PI) / numFlies;

for (let i = 0; i < numFlies; i++) {
  const angle = i * angleIncrement;
  createFly(radius, angle);  // Create each fly at the calculated position
}
/**
 * Galaxy Creation
 */
const parameters = {
  count: 90500,
  size: 0.01,
  radius: 100,
  branches: 3,
  spin: -5, // spin speed
  randomness: 2,
  randomnessPower: 3,
  insideColor:  '#031901',
  outsideColor: '#040b05',
  waveSpeed: 11,
  waveHeight: 0.2
}

let geometry1 = null
let material = null
let points = null
let originalPositions = null
let time = 0; // To track elapsed time for spiraling effect

const generateGalaxy = () => {
  // Dispose old galaxy
  if (points !== null) {
    geometry1.dispose()
    material.dispose()
    scene.remove(points)
  }

  // Geometry
  geometry1 = new THREE.BufferGeometry()
  const positions = new Float32Array(parameters.count * 3)
  const colors = new Float32Array(parameters.count * 3)

  const colorInside = new THREE.Color(parameters.insideColor)
  const colorOutside = new THREE.Color(parameters.outsideColor)

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3

    // Position
    const radius = Math.random() * parameters.radius
    const spinAngle = (radius * parameters.spin) + time * 0.1 // Update based on time
    const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

    const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
    positions[i3 + 1] = randomY
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

    // Color
    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, radius / parameters.radius)

    colors[i3] = mixedColor.r
    colors[i3 + 1] = mixedColor.g
    colors[i3 + 2] = mixedColor.b
  }

  geometry1.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry1.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Store original positions for wave animation
  originalPositions = positions.slice()

  // Material
  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  })

  // Points
  points = new THREE.Points(geometry1, material)
  scene.add(points)
}

let galaxyPosition = { x: -150, y: -100, z: 10 }; // Initial position
const updateGalaxyPosition = () => {
  // Update the position of the galaxy (e.g., move along the x-axis)
  galaxyPosition.x += 0.1;  // Move 0.1 units per frame along the x-axis
  
  // Apply the new position to the galaxy
  if (points) {
    points.position.set(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);
  }
};

const moveGalaxy = (x, y, z) => {
  if (points) {
    points.position.set(x, y, z);  // Move the galaxy to a new position
  }
};

// Generate the galaxy once
generateGalaxy();
moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Set the initial position of the galaxy

/**
 * Debug GUI
 */

gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.add(parameters, 'radius').min(0.01).max(100).step(0.01).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
}) // Increased max value for radius
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.addColor(parameters, 'insideColor').onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.addColor(parameters, 'outsideColor').onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.add(parameters, 'waveSpeed').min(0).max(5).step(0.1).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})
gui.add(parameters, 'waveHeight').min(0).max(2).step(0.1).onFinishChange(() => {
  generateGalaxy(); // Re-generate the galaxy only when needed
  moveGalaxy(galaxyPosition.x, galaxyPosition.y, galaxyPosition.z);  // Keep the position unchanged
})

// --------------------------------------------------------------------------------[Animation Loop]
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  

  // Update the galaxy to move in a spiral
  time += 0.02 // Increased time factor for more noticeable movement

  // Update particles in a wave pattern
  if (points && originalPositions) {
    const positions = points.geometry.attributes.position.array
    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3
      const x = originalPositions[i3]
      const z = originalPositions[i3 + 2]

      // Create wave effect
      const distance = Math.sqrt(x * x + z * z)
      positions[i3 + 1] = originalPositions[i3 + 1] + 
          Math.sin(distance * 2 + elapsedTime * parameters.waveSpeed) * 
          parameters.waveHeight * (1 - distance / parameters.radius)
    }
    points.geometry.attributes.position.needsUpdate = true
  }

  

  const delta = clock.getDelta(); // Time since last frame
  flagMaterial.uniforms.time.value += delta * 5; // Increase the multiplier for faster waving
  
  
  // Update flag animation (if you're using flagMaterial)
  flagMaterial.uniforms.time.value += delta; // Make flag wave continuously

//------------------------------------------------------------------------[WATER]
waterMaterial.uniforms.time.value = elapsedTime;


  // Update animation mixers (e.g., character animations)
  mixers.forEach((mixer) => mixer.update(delta));

  // Update water shader time
 
  // Update water shader time

  // Update controls
  controls.update()


  updateDustParticles(); // Update particle positions
  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
  
}

tick() // Start the animation loop
