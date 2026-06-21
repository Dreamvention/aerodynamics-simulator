<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- 3D Canvas Left -->
    <div class="flex-1 relative bg-slate-950">
      <canvas id="canvas" class="w-full h-full" />
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-lg p-6 shadow-xl">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p class="mt-4 text-center text-sm font-medium text-foreground">Loading model...</p>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="w-96 bg-card border-l border-border shadow-2xl overflow-y-auto">
      <div class="p-6 space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-primary">
            Aerodynamics
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Test and visualize your drone 3D models & calculate aerodynamic data.
          </p>
        </div>

        <!-- File Upload -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-foreground">
            Upload STL/STEP File
          </label>
          <div class="relative group">
            <input
              type="file"
              accept=".stl,.step"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="onFileLoad"
            />
            <div class="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30 group-hover:bg-muted/50 group-hover:border-primary transition-all cursor-pointer">
              <svg class="mx-auto h-8 w-8 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-xs font-semibold text-foreground">Drop file or click to upload</p>
              <p class="text-xs text-muted-foreground mt-1">STL or STEP files only</p>
            </div>
          </div>
        </div>

        <!-- Drone Profile -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-foreground">
            Drone Profile
          </label>
          <select
            v-model="selectedProfile"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all"
          >
            <option value="flat">Flat Disc - Cd: 0.25</option>
            <option value="sloped">Sloped Cone - Cd: 0.35</option>
            <option value="ellipsoid">Ellipsoid - Cd: 0.04</option>
            <option value="sharp">Sharp Form - Cd: 0.20</option>
          </select>
        </div>

        <!-- Wind Speed -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-foreground">
            Wind Speed (m/s)
          </label>
          <input
            v-model.number="windSpeed"
            type="number"
            min="0"
            max="100"
            step="1"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all"
          />
        </div>

        <!-- Calculate Button -->
        <button
          @click="calculateCd"
          class="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2.5 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          Calculate Aerodynamics
        </button>

        <!-- Results -->
        <div v-if="results" class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-bold text-blue-900 dark:text-blue-100">
            ✓ Aerodynamic Results
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Cd (Drag Coefficient):</span>
              <span class="font-semibold text-blue-900 dark:text-blue-100">{{ results.cd.toFixed(4) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Drag Force (N):</span>
              <span class="font-semibold text-blue-900 dark:text-blue-100">{{ results.dragForce.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Dynamic Pressure (Pa):</span>
              <span class="font-semibold text-blue-900 dark:text-blue-100">{{ results.dynamicPressure.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Reference Area (m²):</span>
              <span class="font-semibold text-blue-900 dark:text-blue-100">{{ results.refArea.toFixed(4) }}</span>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="error" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
          <p class="text-sm font-semibold text-red-900 dark:text-red-100">
            ⚠ {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

const windSpeed = ref(10)
const selectedProfile = ref('flat')
const isLoading = ref(false)
const error = ref('')
const results = ref<{
  cd: number
  dragForce: number
  dynamicPressure: number
  refArea: number
} | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let mesh: THREE.Mesh | null = null

const profileData = {
  flat: { cd: 0.25, area: 0.5 },
  sloped: { cd: 0.35, area: 0.45 },
  ellipsoid: { cd: 0.04, area: 0.35 },
  sharp: { cd: 0.20, area: 0.4 },
}

onMounted(() => {
  initThreeJS()
})

function initThreeJS() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a)

  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
  camera.position.z = 3

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshPhongMaterial({ color: 0x3b82f6 })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 5, 5)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  window.addEventListener('resize', onWindowResize)
  animate()
}

function animate() {
  requestAnimationFrame(animate)
  if (mesh) {
    mesh.rotation.x += 0.005
    mesh.rotation.y += 0.008
  }
  renderer.render(scene, camera)
}

function onWindowResize() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function onFileLoad(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isLoading.value = true
  error.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    const arrayBuffer = e.target?.result as ArrayBuffer
    const loader = new STLLoader()
    const geometry = loader.parse(arrayBuffer)

    if (mesh) scene.remove(mesh)
    geometry.center()
    geometry.computeBoundingBox()

    const material = new THREE.MeshPhongMaterial({ color: 0x3b82f6 })
    mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    isLoading.value = false
  }
  reader.readAsArrayBuffer(file)
}

function calculateCd() {
  const profile = profileData[selectedProfile.value as keyof typeof profileData]
  if (!profile) return

  const airDensity = 1.225 // kg/m³
  const refArea = profile.area
  const dynamicPressure = 0.5 * airDensity * Math.pow(windSpeed.value, 2)
  const dragForce = profile.cd * refArea * dynamicPressure

  results.value = {
    cd: profile.cd,
    dragForce,
    dynamicPressure,
    refArea,
  }
}
</script>
