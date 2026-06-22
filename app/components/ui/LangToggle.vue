<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const { locale, setLocale } = useI18n()
</script>

<template>
  <!-- Compact: single square button (for the narrow rail) -->
  <button
    v-if="compact"
    class="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    :title="locale === 'en' ? 'Мова: Українська' : 'Language: English'"
    @click="setLocale(locale === 'en' ? 'uk' : 'en')"
  >
    {{ locale === 'en' ? 'EN' : 'UA' }}
  </button>

  <!-- Segmented: EN | UA -->
  <div v-else class="flex items-center gap-0.5 rounded-lg border bg-card p-0.5 text-[11px] font-semibold">
    <button
      class="rounded px-2 py-1 transition-colors"
      :class="locale === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
      @click="setLocale('en')"
    >EN</button>
    <button
      class="rounded px-2 py-1 transition-colors"
      :class="locale === 'uk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
      @click="setLocale('uk')"
    >UA</button>
  </div>
</template>
