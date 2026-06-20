<template>
  <div class="flex h-screen w-full overflow-hidden">
    <!-- 3D Canvas -->
    <div class="flex-1 relative bg-slate-900">
      <canvas id="canvas" class="w-full h-full" />
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-black/40"
      >
        <div class="bg-white rounded-lg p-6">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p class="mt-4 text-center text-sm font-medium">Loading model...</p>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="w-96 bg-white border-l border-border shadow-lg overflow-y-auto">
      <div class="p-6">
        <h1 class="text-3xl font-bold text-primary mb-2">
          Aerodynamics
        </h1>
        <p class="text-sm text-muted-foreground mb-6">
          Test and visualize your drone 3D models & calculate aerodynamic data.
        </p>

        <!-- File Upload -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium mb-2">
              Upload STL/STEP File
            </label>
            <div class="relative">
              <input
                type="file"
                accept=".stl,.step"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="onFileLoad"
              />
              <div class="border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                <svg class="mx-auto h-8 w-8 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-xs font-medium text-foreground">Drop file or click to upload</p>
                <p class="text-xs text-muted-foreground mt-1">STL or STEP files only</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Drone Profile -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium mb-2">
              Drone Profile
            </label>
            <select
              v-model="selectedProfile"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value="flat">Flat Disc - Cd: 0.25</option>
              <option value="sloped">Sloped Cone - Cd: 0.35</option>
              <option value="ellipsoid">Ellipsoid - Cd: 0.04</option>
              <option value="sharp">Sharp Form - Cd: 0.20</option>
            </select>
          </div>
        </div>

        <!-- Wind Speed -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium mb-2">
              Wind Speed (m/s)
            </label>
            <input
              v-model.number="windSpeed"
              type="number"
              min="0"
              max="100"
              step="1"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
        </div>

        <!-- Calculate Button -->
        <button
          @click="calculateCd"
          class="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors mb-6"
        >
          Calculate Aerodynamics
        </button>

        <!-- Results -->
        <div v-if="results" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-blue-900 mb-3">
            Aerodynamic Results
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-blue-700">Cd (Drag Coeff.):</span>
              <span class="font-semibold text-blue-900">{{ results.cd }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Drag Force @ {{ windSpeed }} m/s:</span>
              <span class="font-semibold text-blue-900">{{ results.dragForce.toFixed(2) }} N</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Air Density:</span>
              <span class="font-semibold text-blue-900">{{ results.airDensity }} kg/m³</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Frontal Area:</span>
              <span class="font-semibold text-blue-900">{{ results.frontalArea.toFixed(4) }} m²</span>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-6 pt-6 border-t border-border space-y-3 text-xs text-muted-foreground">
          <div>
            <p class="font-medium text-foreground mb-1">Drag Equation:</p>
            <p>F = 0.5 × ρ × v² × A × Cd</p>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">Variables:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>ρ = Air density (1.225 kg/m³)</li>
              <li>v = Velocity (wind speed)</li>
              <li>A = Frontal area</li>
              <li>Cd = Drag coefficient</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const selectedProfile = ref('flat')
const windSpeed = ref(40)
const isLoading = ref(false)
const results = ref(null)

const cdValues: Record<string, number> = {
  flat: 0.25,
  sloped: 0.35,
  ellipsoid: 0.04,
  sharp: 0.20
}

const airDensity = 1.225
const frontalArea = 0.0962

let scene: any
let camera: any
let renderer: any
let model: any

onMounted(() => {
  initScene()
  animateScene()
})

function initScene() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  
  scene = new (window as any).THREE.Scene()
  scene.background = new (window as any).THREE.Color(0x1e293b)

  camera = new (window as any).THREE.PerspectiveCamera(
    75,
    (window.innerWidth - 384) / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 4

  renderer = new (window as any).THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(window.innerWidth - 384, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  const light = new (window as any).THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 10, 10)
  scene.add(light)

  const ambientLight = new (window as any).THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const geometry = new (window as any).THREE.CylinderGeometry(0.3, 0.02, 3.2, 32)
  const material = new (window as any).THREE.MeshPhongMaterial({
    color: 0x3b82f6,
    emissive: 0x1e40af
  })
  model = new (window as any).THREE.Mesh(geometry, material)
  scene.add(model)

  window.addEventListener('resize', onWindowResize)
}

function animateScene() {
  requestAnimationFrame(animateScene)
  if (model) {
    model.rotation.x += 0.004
    model.rotation.y += 0.007
  }
  renderer.render(scene, camera)
}

function onWindowResize() {
  const width = window.innerWidth - 384
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function onFileLoad(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isLoading.value = true
  // Simulate file processing
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

function calculateCd() {
  const cd = cdValues[selectedProfile.value]
  const dragForce = 0.5 * airDensity * windSpeed.value ** 2 * frontalArea * cd

  results.value = {
    cd,
    dragForce,
    airDensity,
    frontalArea
  }
}
</script>
