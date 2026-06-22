<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Wind, Plane, Fan, Rocket, Crosshair, Box, Trash2, Clock, UploadCloud } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import LangToggle from '@/components/ui/LangToggle.vue'
import { useModelStore, type ModelMeta } from '@/composables/useModelStore'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const store = useModelStore()
const models = ref<ModelMeta[]>([])
const dragging = ref(false)
const dragDepth = ref(0)
const busy = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  models.value = await store.list()
})

const hasModels = computed(() => models.value.length > 0)

function openDemo() {
  navigateTo('/designer?model=demo')
}
function openDrone() {
  navigateTo('/designer?model=drone')
}
function openRocket() {
  navigateTo('/designer?model=rocket')
}
function openInterceptor() {
  navigateTo('/designer?model=interceptor')
}
function openModel(id: string) {
  navigateTo(`/designer?model=${id}`)
}

async function handleFiles(files: FileList | null) {
  if (!files || !files.length) return
  const file = files[0]
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext !== 'stl' && ext !== 'obj') {
    error.value = t('landing.errUnsupported', { ext })
    return
  }
  busy.value = true
  error.value = ''
  try {
    const meta = await store.save(file)
    navigateTo(`/designer?model=${meta.id}`)
  } catch (e) {
    error.value = t('landing.errSave')
    busy.value = false
  }
}

// Enter/leave counter so moving the cursor over child elements doesn't flicker.
function onDragEnter() {
  dragDepth.value++
  dragging.value = true
}
function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  if (dragDepth.value === 0) dragging.value = false
}
function onDrop(e: DragEvent) {
  dragDepth.value = 0
  dragging.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}

async function deleteModel(id: string, e: Event) {
  e.stopPropagation()
  await store.remove(id)
  models.value = await store.list()
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
function fmtDate(t: number) {
  const d = new Date(t)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div
    class="min-h-screen w-full bg-background text-foreground"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Full-screen drag overlay -->
    <div
      v-if="dragging"
      class="pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-sm"
    >
      <div class="text-center">
        <UploadCloud class="mx-auto h-12 w-12 text-primary" />
        <p class="mt-3 text-lg font-semibold">{{ t('landing.dropTitle') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('landing.dropSub') }}</p>
      </div>
    </div>

    <div class="mx-auto max-w-5xl px-6 py-16 animate-fade-in">
      <!-- Header -->
      <header class="mb-14 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wind class="h-5 w-5" />
          </div>
          <div>
            <h1 class="text-lg font-semibold leading-tight tracking-tight">Aerodynamics Studio</h1>
            <p class="text-xs text-muted-foreground">{{ t('landing.subtitle') }}</p>
          </div>
        </div>
        <LangToggle />
      </header>

      <!-- Hero -->
      <div class="mb-10">
        <h2 class="text-4xl font-semibold tracking-tight">{{ t('landing.heroTitle') }}</h2>
        <p class="mt-3 max-w-2xl text-muted-foreground">{{ t('landing.heroText') }}</p>
      </div>

      <!-- Primary action: upload -->
      <Card
        class="group relative mb-4 cursor-pointer overflow-hidden border-dashed transition-colors hover:border-primary hover:bg-accent/40"
        @click="fileInput?.click()"
      >
        <div class="flex items-center gap-4 p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus class="h-6 w-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold">{{ t('landing.uploadTitle') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('landing.uploadSub') }}</p>
          </div>
          <UploadCloud class="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          ref="fileInput" type="file" accept=".stl,.obj" class="hidden"
          @change="handleFiles(($event.target as HTMLInputElement).files)"
        />
      </Card>

      <!-- Demo models -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          class="group cursor-pointer transition-colors hover:border-primary hover:bg-accent/40"
          @click="openDemo"
        >
          <div class="p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Plane class="h-6 w-6" />
            </div>
            <p class="font-semibold">{{ t('landing.airplane') }}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ t('landing.airplaneSub') }}</p>
          </div>
        </Card>

        <Card
          class="group cursor-pointer transition-colors hover:border-primary hover:bg-accent/40"
          @click="openDrone"
        >
          <div class="p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Fan class="h-6 w-6" />
            </div>
            <p class="font-semibold">{{ t('landing.drone') }}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ t('landing.droneSub') }}</p>
          </div>
        </Card>

        <Card
          class="group cursor-pointer transition-colors hover:border-primary hover:bg-accent/40"
          @click="openRocket"
        >
          <div class="p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Rocket class="h-6 w-6" />
            </div>
            <p class="font-semibold">{{ t('landing.rocket') }}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ t('landing.rocketSub') }}</p>
          </div>
        </Card>

        <Card
          class="group cursor-pointer transition-colors hover:border-primary hover:bg-accent/40"
          @click="openInterceptor"
        >
          <div class="p-6">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Crosshair class="h-6 w-6" />
            </div>
            <p class="font-semibold">{{ t('landing.interceptor') }}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ t('landing.interceptorSub') }}</p>
          </div>
        </Card>
      </div>

      <p v-if="error" class="mt-4 text-sm font-medium text-destructive">{{ error }}</p>
      <p v-if="busy" class="mt-4 text-sm text-muted-foreground">{{ t('landing.saving') }}</p>

      <!-- Recent models -->
      <section class="mt-14">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock class="h-4 w-4" /> {{ t('landing.recent') }}
          </h3>
          <span v-if="hasModels" class="text-xs text-muted-foreground">{{ t('landing.savedCount', { n: models.length }) }}</span>
        </div>

        <div v-if="hasModels" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="m in models" :key="m.id"
            class="group cursor-pointer transition-colors hover:border-primary hover:bg-accent/40"
            @click="openModel(m.id)"
          >
            <div class="flex items-center gap-3 p-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                <Box class="h-5 w-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium" :title="m.name">{{ m.name }}</p>
                <p class="text-xs text-muted-foreground">{{ m.ext.toUpperCase() }} · {{ fmtSize(m.size) }} · {{ fmtDate(m.createdAt) }}</p>
              </div>
              <Button variant="ghost" size="icon-sm" class="opacity-0 group-hover:opacity-100" @click="deleteModel(m.id, $event)">
                <Trash2 class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </Card>
        </div>

        <Card v-else class="border-dashed">
          <div class="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
            <Box class="h-7 w-7 text-muted-foreground/60" />
            <p class="text-sm font-medium">{{ t('landing.noModels') }}</p>
            <p class="text-xs text-muted-foreground">{{ t('landing.noModelsSub') }}</p>
          </div>
        </Card>
      </section>
    </div>
  </div>
</template>
