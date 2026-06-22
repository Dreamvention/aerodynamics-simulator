<script setup lang="ts">
import { ref } from 'vue'
import { Info } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

defineProps<{ text: string; improve?: string }>()
const { t } = useI18n()

const open = ref(false)
const anchor = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({})

function show() {
  const el = anchor.value
  if (!el) return
  const r = el.getBoundingClientRect()
  // Open to the left of the icon, vertically centred, clamped to the viewport.
  const top = Math.min(Math.max(r.top + r.height / 2, 80), window.innerHeight - 80)
  style.value = {
    top: `${top}px`,
    left: `${r.left - 10}px`,
    transform: 'translate(-100%, -50%)',
  }
  open.value = true
}
function hide() {
  open.value = false
}
</script>

<template>
  <span
    ref="anchor"
    class="inline-flex align-middle"
    @mouseenter="show" @mouseleave="hide"
  >
    <Info class="h-3.5 w-3.5 cursor-help text-muted-foreground/50 transition-colors hover:text-foreground" />
    <Teleport to="body">
      <div
        v-if="open"
        :style="style"
        class="pointer-events-none fixed z-[200] w-60 rounded-lg border bg-popover p-2.5 text-left text-xs leading-relaxed text-popover-foreground shadow-xl"
      >
        <span class="block font-medium text-foreground">{{ text }}</span>
        <span v-if="improve" class="mt-1.5 block text-muted-foreground">
          <span class="font-semibold text-foreground">{{ t('hint.improve') }} </span>{{ improve }}
        </span>
      </div>
    </Teleport>
  </span>
</template>
