<template>
  <div class="flex h-screen w-full overflow-hidden bg-background text-foreground">
    <!-- Left rail -->
    <aside class="z-20 flex w-14 shrink-0 flex-col items-center gap-1.5 border-r bg-card py-3">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform hover:scale-105"
        :title="t('d.home')" @click="goHome"
      >
        <Wind class="h-5 w-5" />
      </button>
      <div class="my-1 h-px w-7 bg-border" />
      <button class="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" :title="t('d.resetView')" @click="resetView">
        <RotateCcw class="h-5 w-5" />
      </button>
      <button class="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" :title="t('d.screenshot')" @click="downloadShot">
        <Camera class="h-5 w-5" />
      </button>
      <!-- Language toggle pinned to the bottom -->
      <LangToggle compact class="mt-auto" />
    </aside>

    <!-- Center viewport -->
    <div class="relative min-w-0 flex-1">
      <canvas id="canvas" class="block h-full w-full" />

      <!-- Zoom-aware scale rulers (screen-fixed; tick size = real size at current zoom) -->
      <div class="pointer-events-none absolute inset-0 select-none text-[10px] text-muted-foreground/80">
        <!-- bottom: X scale -->
        <div class="absolute inset-x-0 bottom-0 h-4">
          <div class="absolute inset-x-0 top-0 h-px bg-foreground/15" />
          <template v-for="(tk, i) in rulerX" :key="'rx' + i">
            <div class="absolute top-0 h-1 w-px bg-foreground/30" :style="{ left: tk.p + 'px' }" />
            <div class="absolute top-1 -translate-x-1/2 tabular-nums" :style="{ left: tk.p + 'px' }">{{ tk.label }}</div>
          </template>
          <div class="absolute bottom-0 right-1 font-semibold text-muted-foreground">{{ rulerUnit }}</div>
        </div>
        <!-- left: Y scale -->
        <div class="absolute inset-y-0 left-0 w-9">
          <div class="absolute inset-y-0 right-0 w-px bg-foreground/15" />
          <template v-for="(tk, i) in rulerY" :key="'ry' + i">
            <div class="absolute right-0 h-px w-1 bg-foreground/30" :style="{ bottom: tk.p + 'px' }" />
            <div class="absolute right-1.5 -translate-y-1/2 tabular-nums" :style="{ bottom: tk.p + 'px' }">{{ tk.label }}</div>
          </template>
        </div>
      </div>

      <!-- Rotate-model mode badge -->
      <div v-if="rotateMode === 'model'" class="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border bg-card/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
        ↻ {{ t('d.ringDrag') }} · <span class="text-red-500">X</span> / <span class="text-green-600">Y</span> / <span class="text-blue-600">Z</span>
      </div>

      <!-- Top bar -->
      <div class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 py-3 pr-3 pl-12">
        <div class="pointer-events-auto flex items-center gap-2 rounded-xl border bg-card/90 px-2 py-1.5 shadow-sm backdrop-blur">
          <Button variant="ghost" size="icon-sm" :title="t('d.home')" @click="goHome"><ArrowLeft class="h-4 w-4" /></Button>
          <div class="pr-1">
            <p class="max-w-[240px] truncate text-sm font-semibold leading-tight">{{ modelName }}</p>
            <p class="text-[11px] text-muted-foreground">{{ t('d.tag') }}</p>
          </div>
        </div>
        <div class="pointer-events-auto flex items-center gap-4 rounded-xl border bg-card/90 px-4 py-2 text-xs shadow-sm backdrop-blur">
          <div><span class="text-muted-foreground">{{ t('d.velocity') }} </span><span class="font-semibold tabular-nums">{{ windKph }} kph</span></div>
          <div class="h-4 w-px bg-border" />
          <div><span class="text-muted-foreground">{{ t('d.yaw') }} </span><span class="font-semibold">0°</span></div>
          <div class="h-4 w-px bg-border" />
          <div><span class="text-muted-foreground">{{ t('d.accuracy') }} </span><span class="font-semibold">{{ t('d.regular') }}</span></div>
        </div>
      </div>

      <!-- Viewport hints -->
      <div class="pointer-events-none absolute left-12 top-20 space-y-0.5 text-[11px] text-muted-foreground">
        <p>{{ t('d.hintControls') }}</p>
        <p>{{ t('d.windPre') }} <span class="font-semibold text-red-500">{{ t('d.windAxis') }}</span> {{ t('d.windPost') }}</p>
      </div>

      <!-- Surface legend -->
      <div v-if="surfaceMode !== 'none'" class="absolute bottom-[6.25rem] left-12 rounded-xl border bg-card/95 px-3 py-2 shadow-md backdrop-blur">
        <p class="mb-1 text-[11px] font-medium">{{ surfaceMode === 'pressure' ? t('d.pressureCp') : surfaceMode === 'heat' ? t('d.heatMap') : t('d.friction') }}</p>
        <div class="h-2.5 w-52 rounded-sm" style="background:linear-gradient(to right,#0d33d9,#00bff2,#26cc40,#f2d91a,#ed2920)" />
        <div class="mt-0.5 flex w-52 justify-between text-[10px] text-muted-foreground">
          <template v-if="surfaceMode === 'heat'">
            <span>{{ heatMinC.toFixed(1) }}°C</span>
            <span></span>
            <span>{{ heatMaxC.toFixed(1) }}°C</span>
          </template>
          <template v-else>
            <span>{{ surfaceMode === 'pressure' ? '−1' : t('d.low') }}</span>
            <span>{{ surfaceMode === 'pressure' ? '0' : '' }}</span>
            <span>{{ surfaceMode === 'pressure' ? '+1' : t('d.high') }}</span>
          </template>
        </div>
      </div>

      <!-- Drag-overlay legend (right side; surface legend keeps the left) -->
      <div v-if="showDrag" class="absolute bottom-9 right-4 rounded-xl border bg-card/95 px-3 py-2 shadow-md backdrop-blur">
        <p class="mb-1 text-[11px] font-medium">{{ t('d.dragMap') }}</p>
        <div class="h-2.5 w-52 rounded-sm" style="background:linear-gradient(to right,#d3d6db,#ed2920)" />
        <div class="mt-0.5 flex w-52 justify-between text-[10px] text-muted-foreground">
          <span>{{ t('d.low') }}</span>
          <span>{{ t('d.high') }}</span>
        </div>
      </div>

      <!-- Surface toolbar -->
      <div class="absolute bottom-9 left-12 flex flex-col items-start gap-1">
        <span class="pl-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{{ t('d.surface') }}</span>
        <div class="flex items-center gap-1 rounded-xl border bg-card/95 p-1 shadow-md backdrop-blur">
          <button
            v-for="s in surfaceModes" :key="s.v" @click="setSurfaceMode(s.v)"
            :class="['rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors', surfaceMode === s.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent']"
          >{{ t(s.key) }}</button>
        </div>
      </div>

      <!-- Airflow toolbar (slice slider sits on its own row above, so the bar stays compact) -->
      <div class="absolute bottom-9 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
        <div
          v-if="showFlow && flowMode !== 'volume'"
          class="flex items-center gap-2 rounded-xl border bg-card/95 px-3 py-1.5 shadow-md backdrop-blur"
        >
          <input
            type="range" min="0" max="1" step="0.004"
            v-model.number="slicePos" @input="onSliceChange"
            class="w-44 cursor-pointer accent-primary"
          />
          <span class="w-14 text-right text-[11px] tabular-nums text-muted-foreground">{{ sliceWorldM >= 0 ? '+' : '' }}{{ sliceWorldM.toFixed(2) }} m</span>
        </div>
        <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{{ t('d.airflow') }}</span>
        <div class="flex items-center gap-1.5 rounded-xl border bg-card/95 p-1 shadow-md backdrop-blur">
          <button
            @click="toggleStreamlines"
            :class="['rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors', showFlow ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent']"
          >{{ t('d.streamlines') }}</button>
          <div class="mx-0.5 h-5 w-px bg-border" />
          <button
            v-for="m in flowModes" :key="m.v" @click="setFlowMode(m.v)" :disabled="!showFlow"
            :class="['rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40', flowMode === m.v ? 'bg-secondary text-secondary-foreground ring-1 ring-border' : 'text-muted-foreground hover:bg-accent']"
          >{{ t(m.key) }}</button>
          <div class="mx-0.5 h-5 w-px bg-border" />
          <button
            @click="toggleDrag"
            :class="['rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors', showDrag ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent']"
          >{{ t('d.dragShort') }}</button>
        </div>
      </div>

      <!-- Velocity legend -->
      <div v-if="showFlow" class="absolute bottom-9 right-4 rounded-xl border bg-card/95 px-3 py-2 shadow-md backdrop-blur">
        <p class="mb-1 text-center text-[11px] font-medium">{{ t('d.velocityMs') }}</p>
        <div class="h-2.5 w-52 rounded-sm" style="background:linear-gradient(to right,#1a59f2,#009ed9,#26b340,#f5b80d,#e6291e)" />
        <div class="mt-0.5 flex w-52 justify-between text-[10px] text-muted-foreground">
          <span>0</span><span>{{ windKph }}</span><span>{{ windKph * 2 }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-lg">
          <div class="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p class="text-sm font-medium">{{ t('d.loading') }}</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive shadow">
        {{ error }}
      </div>
    </div>

    <!-- Right panel -->
    <aside class="z-20 flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l bg-background p-3 scrollbar-thin">
      <!-- Aerodynamic Coefficients -->
      <Card class="p-4">
        <h3 class="mb-3 text-sm font-semibold">{{ t('d.coeffs') }}</h3>

        <div class="flex items-center justify-between">
          <p class="flex items-center gap-1.5 text-sm font-medium">
            {{ t('d.dragCoeff') }}
            <InfoHint :text="t('hint.cd.text')" :improve="t('hint.cd.improve')" />
          </p>
          <div class="flex items-center gap-2">
            <span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Cd</span>
            <span class="text-2xl font-semibold tabular-nums">{{ aero.cd.toFixed(3) }}</span>
          </div>
        </div>
        <div class="mt-1 flex items-center justify-between text-sm text-muted-foreground">
          <span class="flex items-center gap-1.5">{{ t('d.dragArea') }}
            <InfoHint :text="t('hint.cda.text')" :improve="t('hint.cda.improve')" />
          </span>
          <span class="flex items-center gap-2"><span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">CdA</span><span class="tabular-nums">{{ aero.cdA.toFixed(3) }} m²</span></span>
        </div>

        <!-- Drag coefficient comparison strip -->
        <div class="mt-4">
          <p class="mb-2 text-xs font-medium text-muted-foreground">{{ t('d.cdCompare') }}</p>

          <!-- value pill (own row, well above the icons, centred over the marker) -->
          <div class="relative mb-2 h-7">
            <span
              class="absolute top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
              :style="{ left: pctClamped(aero.cd) }"
            >{{ aero.cd.toFixed(3) }}</span>
          </div>

          <div class="relative h-14">
            <!-- reference shapes -->
            <div
              v-for="r in cdReferences"
              :key="r.key"
              class="group absolute top-4 -translate-x-1/2 hover:z-50"
              :style="{ left: pct(r.cd) }"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground">
                <component :is="r.icon" class="h-4 w-4" />
              </div>
              <div class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] leading-tight text-background group-hover:block">
                <span class="font-semibold">{{ t('d.cd.' + r.key) }}</span><br>Cd: {{ r.cd.toFixed(2) }}
              </div>
            </div>

            <!-- your model marker: bold dot + dotted line down to the axis -->
            <div class="pointer-events-none absolute top-0 z-10 -translate-x-1/2" :style="{ left: pct(aero.cd) }">
              <div class="mx-auto h-3 w-3 rounded-full bg-blue-500 ring-2 ring-background" />
              <div class="absolute left-1/2 top-3 h-11 -translate-x-1/2 border-l-2 border-dotted border-blue-500" />
            </div>
          </div>

          <!-- axis -->
          <div class="relative mt-1 h-px bg-border">
            <div
              v-for="i in 16"
              :key="i"
              class="absolute top-0 h-1 w-px bg-border"
              :style="{ left: ((i - 1) / 15) * 100 + '%' }"
            />
          </div>
          <div class="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0.0</span><span>0.5</span><span>1.0</span><span>1.5</span>
          </div>
        </div>

        <div class="my-4 h-px bg-border" />

        <div class="flex items-center justify-between">
          <p class="flex items-center gap-1.5 text-sm font-medium">
            {{ t('d.liftCoeff') }}
            <InfoHint :text="t('hint.cl.text')" :improve="t('hint.cl.improve')" />
          </p>
          <div class="flex items-center gap-2">
            <span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Cl</span>
            <span class="text-2xl font-semibold tabular-nums">{{ aero.cl.toFixed(3) }}</span>
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span class="flex items-center gap-1.5">{{ t('d.frontLift') }}
            <InfoHint :text="t('hint.clf.text')" :improve="t('hint.clf.improve')" />
          </span>
          <span class="flex items-center gap-2"><span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Cl(f)</span><span class="tabular-nums">{{ aero.clf.toFixed(3) }}</span></span>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-sm text-muted-foreground">
          <span class="flex items-center gap-1.5">{{ t('d.rearLift') }}
            <InfoHint :text="t('hint.clr.text')" :improve="t('hint.clr.improve')" />
          </span>
          <span class="flex items-center gap-2"><span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Cl(r)</span><span class="tabular-nums">{{ aero.clr.toFixed(3) }}</span></span>
        </div>

        <div class="my-4 h-px bg-border" />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="flex items-center gap-1.5 text-xs text-muted-foreground">{{ t('d.ld') }}
              <InfoHint :text="t('hint.ld.text')" :improve="t('hint.ld.improve')" />
            </p>
            <p class="mt-0.5 flex items-center gap-2"><span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">L/D</span><span class="text-lg font-semibold tabular-nums">{{ aero.ld.toFixed(3) }}</span></p>
          </div>
          <div>
            <p class="flex items-center gap-1.5 text-xs text-muted-foreground">{{ t('d.frontalArea') }}
              <InfoHint :text="t('hint.area.text')" :improve="t('hint.area.improve')" />
            </p>
            <p class="mt-0.5 flex items-center gap-2"><span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">A</span><span class="text-lg font-semibold tabular-nums">{{ aero.area.toFixed(3) }} m²</span></p>
          </div>
        </div>
      </Card>

      <!-- Forces -->
      <Card class="p-4">
        <h3 class="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          {{ t('d.forces') }} <span class="font-normal text-muted-foreground">{{ t('d.forcesAt', { v: windKph }) }}</span>
          <InfoHint :text="t('hint.forces.text')" :improve="t('hint.forces.improve')" />
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="flex items-center gap-1.5 text-muted-foreground">{{ t('d.dragForce') }}
            <InfoHint :text="t('hint.dragforce.text')" :improve="t('hint.dragforce.improve')" /></span><span class="font-semibold tabular-nums">{{ forces.drag.toFixed(2) }} N</span></div>
          <div class="flex justify-between"><span class="flex items-center gap-1.5 text-muted-foreground">{{ t('d.liftForce') }}
            <InfoHint :text="t('hint.liftforce.text')" :improve="t('hint.liftforce.improve')" /></span><span class="font-semibold tabular-nums">{{ forces.lift.toFixed(2) }} N</span></div>
          <div class="flex justify-between"><span class="flex items-center gap-1.5 text-muted-foreground">{{ t('d.dynPressure') }}
            <InfoHint :text="t('hint.dynp.text')" :improve="t('hint.dynp.improve')" /></span><span class="font-semibold tabular-nums">{{ forces.q.toFixed(1) }} Pa</span></div>
        </div>
      </Card>

      <!-- Analysis summary (auto-generated, copy-pasteable) -->
      <Card class="p-4">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ t('d.summary') }}</h3>
          <Button size="sm" class="h-7 gap-1.5 text-xs" @click="copyReport">
            <component :is="copied ? Check : Copy" class="h-3.5 w-3.5" />
            {{ copied ? t('d.copied') : t('d.copy') }}
          </Button>
        </div>
        <p class="mb-2 text-xs text-muted-foreground">{{ t('d.summaryHint') }}</p>
        <textarea
          readonly :value="reportText"
          class="h-40 w-full resize-none rounded-md border border-input bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
      </Card>

      <!-- Conditions -->
      <Card class="p-4">
        <h3 class="mb-3 text-sm font-semibold">{{ t('d.conditions') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-muted-foreground">{{ t('d.windSpeed') }}</label>
            <input
              v-model.number="windKph" type="number" min="0" max="500" step="5"
              class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-muted-foreground">{{ t('d.modelUnits') }}</label>
            <select
              v-model="modelUnits"
              class="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="cm">{{ t('d.cm') }}</option>
              <option value="mm">{{ t('d.mm') }}</option>
              <option value="m">{{ t('d.m') }}</option>
              <option value="in">{{ t('d.in') }}</option>
            </select>
          </div>
        </div>
      </Card>

      <!-- Orientation -->
      <Card class="p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold">
            {{ t('d.orientation') }}
            <InfoHint :text="t('hint.orient.text')" :improve="t('hint.orient.improve')" />
          </h3>
          <Button variant="ghost" size="sm" class="-mr-2 h-7 text-xs" @click="resetOrientation">{{ t('d.reset') }}</Button>
        </div>

        <div class="mb-3 grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
          <button
            @click="setRotateMode('orbit')"
            :class="['rounded-md px-2 py-1.5 text-xs font-medium transition-colors', rotateMode === 'orbit' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground']"
          >{{ t('d.orbitCamera') }}</button>
          <button
            @click="setRotateMode('model')"
            :class="['rounded-md px-2 py-1.5 text-xs font-medium transition-colors', rotateMode === 'model' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground']"
          >{{ t('d.rotateModel') }}</button>
        </div>
        <p class="mb-3 text-xs text-muted-foreground">
          {{ rotateMode === 'model' ? t('d.orientHintModel') : t('d.orientHintOrbit') }}
        </p>

        <p class="mb-1.5 text-xs font-medium text-muted-foreground">{{ t('d.snap90') }}</p>
        <div class="space-y-1.5">
          <div v-for="ax in (['x','y','z'] as const)" :key="ax" class="flex items-center gap-2">
            <span class="w-4 text-xs font-semibold tabular-nums">{{ ax.toUpperCase() }}</span>
            <Button variant="outline" size="sm" class="h-7 flex-1 text-xs" @click="snap90(ax, -1)">−90°</Button>
            <Button variant="outline" size="sm" class="h-7 flex-1 text-xs" @click="snap90(ax, 1)">+90°</Button>
          </div>
        </div>
      </Card>

      <!-- Flaps (control surfaces) -->
      <Card v-if="hasFlaps" class="p-4">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ t('d.flaps') }}</h3>
          <span class="text-xs tabular-nums text-muted-foreground">{{ flapDeg > 0 ? '+' : '' }}{{ flapDeg }}°</span>
        </div>
        <input
          type="range" min="-25" max="25" step="1" :disabled="flapAnim"
          v-model.number="flapDeg" @input="onFlapsInput" @change="onFlapsChange"
          class="w-full cursor-pointer accent-primary disabled:opacity-40"
        />
        <button
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="flapAnim ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
          @click="toggleFlapAnim"
        >{{ flapAnim ? t('d.flapStop') : t('d.flapTest') }}</button>
        <p class="mt-2 text-xs text-muted-foreground">{{ t('d.flapsHint') }}</p>
      </Card>

      <!-- Model info -->
      <Card v-if="modelInfo" class="p-4">
        <h3 class="mb-3 text-sm font-semibold">{{ t('d.model') }}</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-muted-foreground">{{ t('d.dimensions') }}</span><span class="font-medium tabular-nums">{{ fmtLen(modelInfo.dimsM.x) }} × {{ fmtLen(modelInfo.dimsM.y) }} × {{ fmtLen(modelInfo.dimsM.z) }}</span></div>
        </div>
        <p class="mt-3 text-xs text-muted-foreground">{{ t('d.approxNote') }}</p>
        <Button variant="outline" size="sm" class="mt-3 w-full gap-2" @click="exportCAD">
          <Download class="h-4 w-4" /> {{ t('d.exportCad') }}
        </Button>
        <p class="mt-2 text-xs text-muted-foreground">{{ t('d.exportCadNote') }}</p>
      </Card>

      <!-- Components manifest -->
      <Card v-if="modelParts.length" class="p-4">
        <h3 class="mb-3 text-sm font-semibold">{{ t('d.components') }}</h3>
        <ul class="space-y-1.5 text-sm">
          <li v-for="p in modelParts" :key="p.label" class="flex items-baseline justify-between gap-3">
            <span class="text-muted-foreground">{{ p.label }}</span>
            <span class="shrink-0 font-medium tabular-nums">{{ p.dims }}</span>
          </li>
        </ul>
        <p class="mt-3 text-xs text-muted-foreground">{{ t('d.componentsNote') }}</p>
      </Card>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { ArrowLeft, Wind, RotateCcw, Camera, Copy, Check, Download, Droplet, Car, Globe, Truck, Box, PersonStanding } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import InfoHint from '@/components/ui/InfoHint.vue'
import LangToggle from '@/components/ui/LangToggle.vue'
import { useModelStore } from '@/composables/useModelStore'
import { useI18n } from '@/composables/useI18n'
import cessnaStlUrl from '@/assets/cessnanoprop.stl?url'

const route = useRoute()
const store = useModelStore()
const { t } = useI18n()

const windSpeed = ref(50) // m/s internally (physics); 50 m/s = 180 kph
const modelUnits = ref<'mm' | 'cm' | 'm' | 'in'>('cm')
// Velocity is shown/edited in km/h; physics stays in m/s.
const windKph = computed({
  get: () => Math.round(windSpeed.value * 3.6),
  set: (kph: number) => { windSpeed.value = kph / 3.6 },
})
// Aerodynamic heating (surface "heat" view). Adiabatic stagnation temperature rise
// ΔT = V²/(2·cp), cp ≈ 1005 J/(kg·K) for air → ΔT ≈ V²/2010 °C. r is the turbulent
// recovery factor. Ambient assumed 15 °C. At drone speeds the rise is tiny (~1 °C at
// 180 km/h) but scales with V², so it becomes significant near/above the transonic range.
const HEAT_RECOVERY = 0.89
const HEAT_AMBIENT_C = 15
const heatStagRise = computed(() => (windSpeed.value * windSpeed.value) / 2010) // °C at stagnation
const heatMaxC = computed(() => HEAT_AMBIENT_C + heatStagRise.value)                  // stagnation (red)
const heatMinC = computed(() => HEAT_AMBIENT_C + heatStagRise.value * HEAT_RECOVERY)  // recovery temp (blue)
// Screen-fixed scale rulers (tick positions in px from the left/bottom edge).
const rulerX = ref<Array<{ p: number; label: string }>>([])
const rulerY = ref<Array<{ p: number; label: string }>>([])
const rulerUnit = ref<'mm' | 'cm' | 'm' | 'in'>('cm')
const isLoading = ref(false)
const error = ref('')
const showFlow = ref(true)
const flowMode = ref<'volume' | 'sliceY' | 'sliceZ'>('volume')
const slicePos = ref(0.5)
const sliceWorldM = ref(0)
const surfaceMode = ref<'none' | 'pressure' | 'friction' | 'heat'>('none')
const showDrag = ref(false)   // drag-highlight overlay (gray model, red where drag is high)
const flapDeg = ref(0)          // wing-flap deflection (degrees)
const hasFlaps = ref(false)     // does the current model have flaps?
const flapAnim = ref(false)     // run the automatic control-surface sweep?
const rotateMode = ref<'orbit' | 'model'>('orbit') // drag rotates camera vs the model
const modelName = ref('Demo airplane')
const modelInfo = ref<{ dimsM: { x: number; y: number; z: number }; frontalArea: number } | null>(null)
const modelParts = ref<{ label: string; dims: string }[]>([])  // component manifest (demo models)
const aero = ref({ cd: 0, cdA: 0, cl: 0, clf: 0, clr: 0, ld: 0, area: 0 })
const orientInfo = ref({ x: 0, y: 0, z: 0 }) // current model rotation in degrees
const copied = ref(false)

const forces = computed(() => {
  const q = 0.5 * 1.225 * Math.pow(windSpeed.value, 2)
  const A = aero.value.area
  return { q, drag: aero.value.cd * A * q, lift: aero.value.cl * A * q }
})

// Reference drag coefficients for everyday shapes, used in the comparison strip.
const CD_SCALE_MAX = 1.5
const cdReferences = [
  { key: 'teardrop', icon: Droplet, cd: 0.05 },
  { key: 'sedan', icon: Car, cd: 0.3 },
  { key: 'sphere', icon: Globe, cd: 0.5 },
  { key: 'truck', icon: Truck, cd: 0.8 },
  { key: 'cube', icon: Box, cd: 1.0 },
  { key: 'runner', icon: PersonStanding, cd: 1.2 },
] as const
const pct = (v: number) => `${(Math.min(Math.max(v, 0), CD_SCALE_MAX) / CD_SCALE_MAX) * 100}%`
// Same position, but kept away from the edges so the centred value pill never overflows.
const pctClamped = (v: number) => `${Math.min(Math.max((Math.min(Math.max(v, 0), CD_SCALE_MAX) / CD_SCALE_MAX) * 100, 8), 92)}%`

// Auto-generated, copy-pasteable analysis report (English, for handing to an AI).
const reportText = computed(() => {
  const a = aero.value, f = forces.value, mi = modelInfo.value, o = orientInfo.value
  const dims = mi ? `${mi.dimsM.x.toFixed(3)} x ${mi.dimsM.y.toFixed(3)} x ${mi.dimsM.z.toFixed(3)} m` : 'n/a'
  const orient = (o.x || o.y || o.z) ? `X ${o.x}°, Y ${o.y}°, Z ${o.z}°` : 'default (un-rotated)'
  return [
    `Aerodynamic analysis — ${modelName.value}`,
    ``,
    `Conditions:`,
    `- Wind speed: ${windSpeed.value} m/s (air along +X, density 1.225 kg/m³)`,
    `- Dynamic pressure q: ${f.q.toFixed(1)} Pa`,
    `- Model orientation vs wind: ${orient}`,
    `- Bounding dimensions (L x H x W): ${dims}`,
    `- Frontal area (A): ${a.area.toFixed(4)} m²`,
    ``,
    `Coefficients (dimensionless):`,
    `- Drag coefficient Cd: ${a.cd.toFixed(3)}`,
    `- Drag area CdA: ${a.cdA.toFixed(4)} m²`,
    `- Lift coefficient Cl: ${a.cl.toFixed(3)}`,
    `- Front lift Cl(f): ${a.clf.toFixed(3)}`,
    `- Rear lift Cl(r): ${a.clr.toFixed(3)}`,
    `- Lift/drag ratio L/D: ${a.ld.toFixed(3)}`,
    ``,
    `Forces at ${windSpeed.value} m/s:`,
    `- Drag force: ${f.drag.toFixed(2)} N`,
    `- Lift force: ${f.lift.toFixed(2)} N`,
    ``,
    `Method: engineering approximation from a simplified voxel flow field — drag from a Newtonian impact model (front-silhouette) plus skin-friction and base-wake terms; lift from surface-pressure (Bernoulli) asymmetry plus an inclined-surface (Newtonian) lift term. Not a full CFD solve; treat values as qualitative/relative (in particular, circulation- and ground-effect-driven downforce is only partially captured).`,
    ``,
    `Task: Analyze these aerodynamics and suggest concrete shape changes to reduce drag (Cd and CdA) while keeping the model stable (balanced front/rear lift). Point out the biggest drag contributors and trade-offs.`,
  ].join('\n')
})

async function copyReport() {
  try {
    await navigator.clipboard.writeText(reportText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    /* clipboard blocked — the textarea is selectable as a fallback */
  }
}

// ---- CAD export (OBJ, one named solid per component → hideable bodies in Fusion 360) ----
const ROLE_PART: Record<string, string> = {
  shell: 'Fuselage', battery: 'Battery', payload: 'Payload', init: 'Initiation_board',
  cap: 'Capacitor', vtx: 'VTX', rx: 'Receiver', esc: 'ESC', pcb: 'PCB', camera: 'Camera',
}
function partName(o: THREE.Object3D): string {
  return o.userData?.part || ROLE_PART[o.userData?.role as string] || 'Misc'
}
function exportCAD() {
  if (!model) return
  model.updateMatrixWorld(true)
  // Bake everything into the model's design frame (strip the user's view orientation).
  const rootInv = new THREE.Matrix4().copy(model.matrixWorld).invert()
  const groups = new Map<string, THREE.BufferGeometry[]>()
  model.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || !m.geometry) return
    const g = m.geometry.clone().toNonIndexed()
    g.applyMatrix4(rootInv.clone().multiply(m.matrixWorld))
    const clean = new THREE.BufferGeometry()
    clean.setAttribute('position', g.getAttribute('position'))
    const name = partName(m)
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name)!.push(clean)
  })
  const out = new THREE.Group()
  for (const [name, geos] of groups) {
    const merged = BufferGeometryUtils.mergeGeometries(geos, false)
    if (!merged) continue
    merged.computeVertexNormals()
    const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial())
    mesh.name = name // becomes a separate, hideable body in Fusion 360 (units: mm)
    out.add(mesh)
  }
  const text = new OBJExporter().parse(out)
  const blob = new Blob([text], { type: 'model/obj' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(modelName.value || 'model').replace(/\s+/g, '_')}.obj`
  a.click()
  URL.revokeObjectURL(url)
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let gizmo: TransformControls | null = null
let model: THREE.Object3D | null = null
let currentBox: THREE.Box3 | null = null
let grid: THREE.GridHelper | null = null
let windArrow: THREE.ArrowHelper | null = null
let rulerKey = ''
let clock: THREE.Clock
let frameId = 0

let field: {
  ox: number; oy: number; oz: number
  cell: number
  nx: number; ny: number; nz: number
  dist: Float32Array
  rearIx: Int16Array; cy: number; cz: number  // wake: rear-most solid per (y,z) column + wake axis
} | null = null
const DIST_CAP = 10

let streamlines: { lines: LineSegments2[]; materials: LineMaterial[]; maxDim: number } | null = null

// Spinning propellers + their induced-flow (downwash) discs, for the demo drone.
let propPivots: THREE.Object3D[] = []
let propDiscs: Array<{ c: THREE.Vector3; axis: THREE.Vector3; r: number; spin: number }> = []

// Nose gimbal camera (interceptor): tilts up ↔ forward ↔ down.
let gimbalPivot: THREE.Object3D | null = null
let gimbalPhase = 0

// Deflectable wing flaps (control surfaces) — hinged trailing-edge panels.
let flapPivots: THREE.Object3D[] = []
let flapPhase = 0

// User model orientation (applied to the wrapper pivot).
const orientQuat = new THREE.Quaternion()

const UNIT_TO_M: Record<string, number> = { mm: 0.001, cm: 0.01, m: 1, in: 0.0254 }
// Real-world metres per geometry unit — driven by the unit selector (sets the physical scale).
const metresPerUnit = computed(() => UNIT_TO_M[modelUnits.value])
// Re-run the physics (frontal area, coefficients, forces) when the unit scale changes.
watch(modelUnits, () => { if (model) rebuildModel(false) })

const flowModes = [
  { v: 'volume', key: 'd.mode3d' },
  { v: 'sliceY', key: 'd.modeTop' },
  { v: 'sliceZ', key: 'd.modeSide' },
] as const

const surfaceModes = [
  { v: 'none', key: 'd.none' },
  { v: 'pressure', key: 'd.pressure' },
  { v: 'friction', key: 'd.frictionShort' },
  { v: 'heat', key: 'd.heatShort' },
] as const

onMounted(async () => {
  initThreeJS()
  const id = route.query.model as string | undefined
  if (id === 'drone') {
    loadDemoDrone()
  } else if (id === 'rocket') {
    loadDemoRocket()
  } else if (id === 'interceptor') {
    loadDemoInterceptor()
  } else if (id && id !== 'demo') {
    isLoading.value = true
    try {
      const rec = await store.get(id)
      if (rec) {
        modelName.value = rec.name
        loadFromData(rec.ext, rec.data)
      } else {
        loadDemoAirplane()
      }
    } catch {
      loadDemoAirplane()
    } finally {
      isLoading.value = false
    }
  } else {
    loadDemoAirplane()
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  window.removeEventListener('resize', onWindowResize)
  gizmo?.dispose()
  renderer?.dispose()
})

function goHome() {
  navigateTo('/')
}

function makeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x6b7280,
    metalness: 0.1,
    roughness: 0.6,
    side: THREE.DoubleSide,
  })
}

// Internal components are cosmetic only — excluded from the aero computation.
const INTERNAL_ROLES = new Set(['battery', 'pcb', 'esc', 'init', 'cap', 'vtx', 'rx', 'payload'])
function isInternal(o: THREE.Object3D): boolean {
  return INTERNAL_ROLES.has(o.userData?.role)
}

/** Material for a mesh given its role (transparent shell, coloured internals…). */
function roleMaterial(role: string | undefined): THREE.Material {
  const std = (color: number, metalness = 0.3, roughness = 0.5) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness })
  switch (role) {
    case 'shell': // see-through fuselage so the internals show
      return new THREE.MeshStandardMaterial({
        color: 0x9aa3ad, metalness: 0.1, roughness: 0.35,
        transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide,
      })
    case 'battery': return std(0x2b4d7a, 0.2)    // LiPo (blue)
    case 'pcb': return std(0x14401f, 0.25)       // PCB (green): FC, GPS/link
    case 'esc': return std(0x2b3138, 0.35)       // ESC / regulator (dark)
    case 'init': return std(0xd8d4c6, 0.05, 0.7) // potted initiation board (white)
    case 'cap': return std(0x161616)             // capacitor (black)
    case 'vtx': return std(0x4a2655)             // video TX (purple)
    case 'rx': return std(0x1f5145)              // ELRS receiver (teal)
    case 'payload': return std(0xb8742a, 0.2, 0.6) // front payload (amber)
    case 'camera': return std(0x202428, 0.5, 0.35)  // gimbal turret nose (dark housing)
    default: return makeMaterial()
  }
}

function initThreeJS() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xeceef2)

  camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.01, 100000)
  camera.position.set(120, 90, 180)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcc6, 1.0))
  const key = new THREE.DirectionalLight(0xffffff, 1.1)
  key.position.set(1, 2, 1.5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.4)
  fill.position.set(-1.5, -0.5, -1)
  scene.add(fill)

  // Fusion-style rotation gizmo (3 colored axis rings). Hidden until "Rotate model".
  gizmo = new TransformControls(camera, renderer.domElement)
  gizmo.setMode('rotate')
  gizmo.setSpace('world')
  gizmo.setSize(0.9)
  gizmo.enabled = false
  gizmo.visible = false
  gizmo.addEventListener('dragging-changed', (e) => {
    controls.enabled = !e.value
    if (!e.value) { // drag finished → recompute flow for the new pose
      if (model) orientQuat.copy(model.quaternion)
      rebuildModel(false)
    }
  })
  scene.add(gizmo)

  clock = new THREE.Clock()
  window.addEventListener('resize', onWindowResize)
  animate()
}

function buildAirplane(): THREE.Group {
  propPivots = []
  gimbalPivot = null
  flapPivots = []
  modelParts.value = []
  const g = new THREE.Group()
  const add = (geo: THREE.BufferGeometry, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo)
    m.position.set(x, y, z)
    g.add(m)
    return m
  }
  const fuse = new THREE.CylinderGeometry(7, 7, 150, 24); fuse.rotateZ(Math.PI / 2); add(fuse)
  const nose = new THREE.ConeGeometry(7, 36, 24); nose.rotateZ(Math.PI / 2); add(nose, -93, 0, 0)
  const tail = new THREE.ConeGeometry(7, 30, 24); tail.rotateZ(-Math.PI / 2); add(tail, 90, 0, 0)
  add(new THREE.BoxGeometry(46, 5, 210), -8, 0, 0)
  add(new THREE.BoxGeometry(28, 4, 86), 70, 0, 0)
  add(new THREE.BoxGeometry(34, 40, 4), 70, 22, 0)
  const canopy = add(new THREE.SphereGeometry(9, 20, 16), -34, 6, 0)
  canopy.scale.set(2.4, 0.7, 0.8)
  return g
}

async function loadDemoAirplane() {
  error.value = ''
  modelName.value = 'Cessna'
  propPivots = []; gimbalPivot = null; flapPivots = []; modelParts.value = []
  isLoading.value = true
  try {
    const res = await fetch(cessnaStlUrl)
    const geometry = new STLLoader().parse(await res.arrayBuffer())
    geometry.rotateX(-Math.PI / 2) // STL is Z-up → lay the aircraft level (was nose-vertical)
    // Scale to a real Cessna 152 (wingspan ≈ 10.2 m) so frontal area / forces are realistic.
    geometry.computeBoundingBox()
    const bb = geometry.boundingBox!
    const span = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) || 1
    geometry.scale(10.2 / span, 10.2 / span, 10.2 / span)
    modelUnits.value = 'm'         // geometry now in metres → real-scale physics
    setModel(new THREE.Mesh(geometry, makeMaterial()))
  } catch (err) {
    error.value = t('d.parseFail', { msg: (err as Error).message })
    modelUnits.value = 'mm'
    setModel(buildAirplane()) // fall back to the procedural demo
  } finally {
    isLoading.value = false
  }
}

// Forward-flight pitch of the drone (nose-down), radians.
const DRONE_PITCH = 0.18

/** A single tapered, slightly curved propeller blade (radial along +X). */
function makeBladeGeometry(propR: number): THREE.ExtrudeGeometry {
  const w = 5.5 // chord half-width
  const s = new THREE.Shape()
  s.moveTo(7, -w * 0.45)
  s.quadraticCurveTo(propR * 0.55, -w, propR * 0.95, -w * 0.4)
  s.quadraticCurveTo(propR * 1.02, 0, propR * 0.95, w * 0.4)
  s.quadraticCurveTo(propR * 0.55, w, 7, w * 0.45)
  s.quadraticCurveTo(2, 0, 7, -w * 0.45)
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false })
  geo.translate(0, 0, -0.8)
  geo.rotateX(Math.PI / 2) // lay flat: x radial, z chord, thin in y
  return geo
}

function buildDrone(): THREE.Group {
  propPivots = []
  gimbalPivot = null
  flapPivots = []
  modelParts.value = []
  const g = new THREE.Group()
  const Y = new THREE.Vector3(0, 1, 0)
  const add = (geo: THREE.BufferGeometry, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo)
    m.position.set(x, y, z)
    g.add(m)
    return m
  }
  // Place a mesh and aim its local +Y along `dir` (for tubes/struts).
  const addAimed = (geo: THREE.BufferGeometry, pos: THREE.Vector3, dir: THREE.Vector3) => {
    const m = new THREE.Mesh(geo)
    m.position.copy(pos)
    m.quaternion.setFromUnitVectors(Y, dir.clone().normalize())
    g.add(m)
    return m
  }

  // ---- Central body: hex frame plate + aerodynamic canopy + underbody battery
  add(new THREE.CylinderGeometry(40, 47, 12, 6)) // hex frame plate
  const canopy = add(new THREE.SphereGeometry(30, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2), 0, 5, 0)
  canopy.scale.set(1.0, 0.62, 1.18) // low, slightly elongated dome
  add(new THREE.BoxGeometry(66, 14, 38), 4, -12, 0) // battery pod (under body)

  // Front FPV camera + lens
  add(new THREE.BoxGeometry(15, 13, 17), -40, -3, 0)
  const lens = add(new THREE.CylinderGeometry(4.5, 5.5, 7, 16), -49, -3, 0)
  lens.rotation.z = Math.PI / 2

  const R = 118 // centre → motor
  const propR = 49
  const dirs: Array<[number, number]> = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  for (const [sx, sz] of dirs) {
    const dx = sx / Math.SQRT2, dz = sz / Math.SQRT2
    const dir = new THREE.Vector3(dx, 0, dz)

    // tapered round arm tube from hub to motor
    addAimed(new THREE.CylinderGeometry(4.5, 7, R * 1.02, 14), new THREE.Vector3((dx * R) / 2, 0, (dz * R) / 2), dir)

    // bell motor + top cap
    add(new THREE.CylinderGeometry(10, 11.5, 14, 20), dx * R, 4, dz * R)
    add(new THREE.CylinderGeometry(11.5, 11.5, 3, 20), dx * R, 12, dz * R)

    // spinning propeller: hub + two curved tapered blades with pitch
    const prop = new THREE.Group()
    prop.position.set(dx * R, 16, dz * R)
    prop.add(new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 5, 14)))
    const bladeGeo = makeBladeGeometry(propR)
    for (let k = 0; k < 2; k++) {
      const bl = new THREE.Mesh(bladeGeo)
      bl.rotation.y = k * Math.PI
      bl.rotation.x = 0.22 // blade pitch
      prop.add(bl)
    }
    g.add(prop)
    propPivots.push(prop)

    // angled landing strut + foot
    addAimed(new THREE.CylinderGeometry(2.3, 2.6, 48, 10), new THREE.Vector3(dx * R * 0.5, -24, dz * R * 0.5), new THREE.Vector3(dx, -2.4, dz))
    add(new THREE.SphereGeometry(3.4, 10, 8), dx * R * 0.66, -44, dz * R * 0.66)
  }

  // Pitch nose-down for forward flight (front camera is at −X)
  g.rotation.z = DRONE_PITCH
  return g
}

function loadDemoDrone() {
  error.value = ''
  modelName.value = 'Demo drone'
  modelUnits.value = 'mm' // procedural demo is modelled at mm scale
  setModel(buildDrone())
}

function buildRocket(): THREE.Group {
  propPivots = []
  gimbalPivot = null
  flapPivots = []
  modelParts.value = []
  const g = new THREE.Group()
  const add = (geo: THREE.BufferGeometry, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo)
    m.position.set(x, y, z)
    g.add(m)
    return m
  }

  // Body, nose (apex into the wind at −X), flared nozzle at the tail, a detail band
  const body = new THREE.CylinderGeometry(20, 20, 240, 28); body.rotateZ(Math.PI / 2); add(body)
  const nose = new THREE.ConeGeometry(20, 70, 28); nose.rotateZ(Math.PI / 2); add(nose, -155, 0, 0)
  const nozzle = new THREE.CylinderGeometry(10, 22, 30, 24); nozzle.rotateZ(Math.PI / 2); add(nozzle, 135, 0, 0)
  const band = new THREE.CylinderGeometry(21, 21, 10, 28); band.rotateZ(Math.PI / 2); add(band, -36, 0, 0)

  // Four swept tail fins
  const fs = new THREE.Shape()
  fs.moveTo(0, 0); fs.lineTo(78, 0); fs.lineTo(78, 56); fs.lineTo(40, 56); fs.closePath()
  const finGeo = new THREE.ExtrudeGeometry(fs, { depth: 3, bevelEnabled: false })
  finGeo.translate(44, 20, -1.5)
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeo)
    fin.rotation.x = (i * Math.PI) / 2
    g.add(fin)
  }

  return g
}

function loadDemoRocket() {
  error.value = ''
  modelName.value = 'Demo rocket'
  modelUnits.value = 'mm' // procedural demo is modelled at mm scale
  setModel(buildRocket())
}

// High-speed hybrid (quad + wings) interceptor, sized for ~400 km/h.
// All sizes in millimetres → Ø80 mm fuselage, ~450 mm long (L/D ≈ 5.6).
function buildInterceptor(): THREE.Group {
  propPivots = []
  gimbalPivot = null
  flapPivots = []
  modelParts.value = []
  const g = new THREE.Group()
  const Y = new THREE.Vector3(0, 1, 0)
  const add = (geo: THREE.BufferGeometry, x = 0, y = 0, z = 0, role?: string) => {
    const m = new THREE.Mesh(geo); m.position.set(x, y, z)
    if (role) m.userData.role = role
    g.add(m); return m
  }
  const addAimed = (geo: THREE.BufferGeometry, pos: THREE.Vector3, dir: THREE.Vector3) => {
    const m = new THREE.Mesh(geo); m.position.copy(pos)
    m.quaternion.setFromUnitVectors(Y, dir.clone().normalize()); g.add(m); return m
  }

  const bodyR = 52            // Ø104 mm — sized to fit the 65×75 mm LiPo
  const cylLen = 250          // central section (battery + electronics)
  const noseLen = 130         // ogive nose
  const tailLen = 72          // boat-tail
  const cylFront = -cylLen / 2, cylRear = cylLen / 2

  // ---- Fuselage shell: one smooth symmetric "lens" body of revolution (transparent) ----
  // Pointed nose → max diameter over the battery → pointed faired tail (no hard corners).
  const L = noseLen + cylLen + tailLen          // 452 mm overall
  const sNose = 170                             // pointed nose taper
  const sMid = 330                              // full diameter held across the battery
  const noseTipR = 12                           // finer nose dome (less stagnation, still houses the camera)
  const tailTipR = 4                            // fine pointed tail
  const profile: THREE.Vector2[] = []
  for (let i = 0; i <= 72; i++) {
    const d = (i / 72) * L                      // distance from the nose tip (0 … L)
    let r: number
    if (d <= sNose) { const u = d / sNose; r = bodyR - (bodyR - noseTipR) * Math.pow(1 - u, 1.5) }  // rounded nose dome
    else if (d <= sMid) { r = bodyR }                                                                // full mid (battery)
    else { const v = (d - sMid) / (L - sMid); r = bodyR - (bodyR - tailTipR) * Math.pow(v, 1.5) }    // pointed tail
    profile.push(new THREE.Vector2(Math.max(0.6, r), L - d))
  }
  const bodyGeo = new THREE.LatheGeometry(profile, 48); bodyGeo.rotateZ(Math.PI / 2)
  bodyGeo.scale(1, 0.92, 1)                        // flatten the cross-section into an ellipse → smaller frontal area
  add(bodyGeo, cylRear + tailLen, 0, 0, 'shell')   // rounded nose at −255, tail tip at +197

  // ---- Internal components (visible through the transparent shell) ----
  const armX = 80 // arm/axis plane (see arms below)

  // FRONT PAYLOAD — plain flat-front cylinder in the nose (no pointed tip).
  const payload = new THREE.CylinderGeometry(37, 37, 86, 26); payload.rotateZ(Math.PI / 2)
  add(payload, -112, 0, 0, 'payload')                  // Ø74 × 86, front face ≈ −155

  // Potted initiation board — directly behind the payload (arms it)
  add(new THREE.BoxGeometry(18, 46, 52), -58, 0, 0, 'init')

  // Main LiPo — 120 × 65 × 75 mm, mid section between payload and the control stack
  add(new THREE.BoxGeometry(120, 65, 75), 11, 0, 0, 'battery')

  // Tail avionics stack — exactly the boards from the wiring diagram, tightly stacked
  // behind the battery (boards ⟂ to the body axis). No filler.
  add(new THREE.BoxGeometry(6, 56, 56), armX - 6, 0, 0, 'esc')   // AM32 4-in-1 ESC
  add(new THREE.BoxGeometry(5, 48, 48), armX + 6, 0, 0, 'pcb')   // FC-F405V2
  const cap = new THREE.CylinderGeometry(7, 7, 16, 14); cap.rotateZ(Math.PI / 2)
  add(cap, armX - 6, 31, 0, 'cap')                               // low-ESR capacitor
  add(new THREE.BoxGeometry(6, 44, 44), 98, 0, 0, 'vtx')   // video transmitter (VTX)
  add(new THREE.BoxGeometry(6, 40, 40), 110, 0, 0, 'rx')   // EP1 Dual ELRS receiver
  add(new THREE.BoxGeometry(6, 36, 36), 121, 0, 0, 'pcb')  // SM-B-IPEX
  add(new THREE.BoxGeometry(5, 32, 32), 131, 0, 0, 'pcb')  // TC43
  add(new THREE.BoxGeometry(6, 28, 28), 141, 0, 0, 'esc')  // MP4560 buck regulator

  // Gimbal camera turret forming the very nose of the drone — pivots up ↔ fwd ↔ down (animated)
  const noseTipX = cylFront - noseLen
  const gimbal = new THREE.Group()
  gimbal.position.set(noseTipX + 5, 0, 0)   // ball radius ≈ body radius here → faired smoothly into the nose
  const ball = new THREE.Mesh(new THREE.SphereGeometry(14, 26, 18)); ball.scale.set(1, 0.92, 0.92)
  ball.userData.role = 'camera'; gimbal.add(ball)
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 8, 18)); lens.rotation.z = Math.PI / 2
  lens.position.set(-12, 0, 0); lens.userData.role = 'camera'; gimbal.add(lens)
  g.add(gimbal); gimbalPivot = gimbal

  // ---- 4 radial arms + cruciform delta wings + pusher props ----
  const armBaseX = 80
  const Rout = 135           // axis → motor: only as far as prop clearance needs
  const propR = 60
  const radial: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]]

  // Wing: from the front of the fuselage out to the motor (swept delta).
  const ws = new THREE.Shape()
  ws.moveTo(cylFront, bodyR * 0.8)   // root sunk into the fuselage so the wing meets it with no gap
  ws.lineTo(armBaseX, bodyR * 0.8)
  ws.lineTo(armBaseX, Rout)
  ws.closePath()
  const wingGeo = new THREE.ExtrudeGeometry(ws, {
    depth: 1.4, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 2.2, bevelSegments: 2,
  })
  wingGeo.translate(0, 0, -0.7)

  for (const [uy, uz] of radial) {
    const dir = new THREE.Vector3(0, uy, uz)
    // Faired arm strut: elliptical section stretched along the wind (X), thin across —
    // streamlines the bluff round arm and is rooted DEEP into the fuselage (no gap).
    const armInner = bodyR - 22
    const armCenter = (armInner + Rout) / 2
    const armGeo = new THREE.CylinderGeometry(7, 11, Rout - armInner, 16)
    armGeo.scale(2.2, 1, 0.72)   // local X → world X (chord); local Z → thinner
    addAimed(armGeo, new THREE.Vector3(armBaseX, uy * armCenter, uz * armCenter), dir).userData.part = 'Arm'

    const a = Math.atan2(uz, uy)
    const wing = new THREE.Mesh(wingGeo)
    wing.rotation.x = a
    wing.userData.part = 'Wing'
    g.add(wing)

    // Deflectable flap (control surface) built INTO the wing's rear section, hinged
    // ahead of the trailing edge so the panel never reaches the pusher prop behind it.
    const flapPlane = new THREE.Group(); flapPlane.rotation.x = a
    const flapChord = 36
    const flapInner = bodyR + 6              // 58 mm — starts just off the body
    const flapOuter = Rout - 28              // 107 mm — out toward the nacelle, clear of it
    const hinge = new THREE.Group(); hinge.position.set(armBaseX - flapChord, 0, 0) // hinge inside the wing
    const flapMesh = new THREE.Mesh(new THREE.BoxGeometry(flapChord, flapOuter - flapInner, 5))
    flapMesh.position.set(flapChord / 2, (flapInner + flapOuter) / 2, 0) // rear strip of the wing, ahead of the props
    flapMesh.userData.part = 'Flap'
    hinge.add(flapMesh)
    flapPlane.add(hinge); g.add(flapPlane)
    flapPivots.push(hinge)
    // servo actuator buried at the inboard root of the hinge
    const servo = new THREE.Mesh(new THREE.BoxGeometry(13, 10, 11)); servo.userData.role = 'esc'; servo.userData.part = 'Servo'
    servo.position.set(armBaseX - flapChord - 4, flapInner + 2, 0); flapPlane.add(servo)

    // streamlined motor nacelle: pointed ogive front + body + tapered tail (toward the prop)
    const mx = armBaseX, my = uy * Rout, mz = uz * Rout
    const podNose = new THREE.ConeGeometry(11, 30, 18); podNose.rotateZ(Math.PI / 2)
    add(podNose, mx - 19, my, mz).userData.part = 'Nacelle'   // apex into the wind (−X)
    const podBody = new THREE.CylinderGeometry(11, 11, 20, 18); podBody.rotateZ(Math.PI / 2)
    add(podBody, mx + 6, my, mz).userData.part = 'Nacelle'
    const podTail = new THREE.ConeGeometry(11, 12, 18); podTail.rotateZ(-Math.PI / 2)
    add(podTail, mx + 22, my, mz).userData.part = 'Nacelle'   // taper back toward the pusher prop

    // pusher propeller spinning behind the arm (disc in Y–Z, thrust −X)
    const prop = new THREE.Group()
    prop.position.set(mx + 28, my, mz)
    prop.quaternion.setFromUnitVectors(Y, new THREE.Vector3(-1, 0, 0))
    prop.add(new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 8, 14)))
    const bladeGeo = makeBladeGeometry(propR)
    for (let k = 0; k < 2; k++) {
      const bl = new THREE.Mesh(bladeGeo); bl.rotation.y = k * Math.PI; bl.rotation.x = 0.2; prop.add(bl)
    }
    prop.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.userData.part = 'Propeller' })
    g.add(prop); propPivots.push(prop)
  }

  modelParts.value = [
    { label: 'Payload', dims: 'Ø74 × 86 mm' },
    { label: 'Battery (LiPo)', dims: '120 × 65 × 75 mm' },
    { label: 'Initiation board', dims: '52 × 46 × 18 mm' },
    { label: 'FC — F405V2', dims: '48 × 48 mm' },
    { label: 'ESC — AM32 (4-in-1)', dims: '56 × 56 mm' },
    { label: 'VTX (video)', dims: '44 × 44 mm' },
    { label: 'RX — EP1 Dual ELRS', dims: '40 × 40 mm' },
    { label: 'SM-B-IPEX', dims: '36 × 36 mm' },
    { label: 'TC43', dims: '32 × 32 mm' },
    { label: 'Buck — MP4560', dims: '28 × 28 mm' },
    { label: 'Capacitor', dims: 'Ø14 × 16 mm' },
    { label: 'Gimbal camera', dims: 'Ø22 mm' },
  ]
  return g
}

function loadDemoInterceptor() {
  error.value = ''
  modelName.value = 'Demo interceptor'
  modelUnits.value = 'mm' // procedural demo is modelled at mm scale
  setModel(buildInterceptor())
}

function loadFromData(ext: string, data: ArrayBuffer) {
  propPivots = []
  gimbalPivot = null
  flapPivots = []
  modelParts.value = []
  try {
    if (ext === 'stl') {
      const geometry = new STLLoader().parse(data)
      setModel(new THREE.Mesh(geometry, makeMaterial()))
    } else {
      const text = new TextDecoder().decode(data)
      setModel(new OBJLoader().parse(text))
    }
  } catch (err) {
    error.value = t('d.parseFail', { msg: (err as Error).message })
    loadDemoAirplane()
  }
}

function setModel(object: THREE.Object3D) {
  if (model) {
    scene.remove(model)
    model.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
    })
  }

  object.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) {
      if (m.geometry && !m.geometry.attributes.normal) m.geometry.computeVertexNormals()
      m.material = roleMaterial(m.userData?.role)
    }
  })

  // Centre the loaded object, then wrap it in a pivot the user can re-orient.
  const box = new THREE.Box3().setFromObject(object)
  object.position.sub(box.getCenter(new THREE.Vector3()))
  orientQuat.identity()
  const root = new THREE.Group()
  root.add(object)
  root.quaternion.copy(orientQuat)
  scene.add(root)
  model = root

  hasFlaps.value = flapPivots.length > 0
  flapDeg.value = 0 // flaps are built neutral
  flapAnim.value = false
  rebuildModel(true)
  setRotateMode(rotateMode.value) // (re)attach the gizmo to the new model if active
}

function applyFlaps() {
  const a = (flapDeg.value * Math.PI) / 180
  for (const f of flapPivots) f.rotation.y = a
}
function onFlapsInput() { applyFlaps() }           // live visual while dragging
function onFlapsChange() { applyFlaps(); rebuildModel(false) } // recompute flow on release
function toggleFlapAnim() {
  flapAnim.value = !flapAnim.value
  // When the sweep stops, settle the flaps where they are and recompute the flow.
  if (!flapAnim.value) onFlapsChange()
}

/** Recompute everything from the current model pose (field, flow, metrics, camera). */
function rebuildModel(refit = false) {
  if (!model) return
  scene.updateMatrixWorld(true)
  const worldBox = new THREE.Box3().setFromObject(model)
  const size = worldBox.getSize(new THREE.Vector3())
  const radius = worldBox.getBoundingSphere(new THREE.Sphere()).radius || 1

  currentBox = worldBox
  updateSceneScale(size, radius)
  updateModelInfo(size)
  buildField(worldBox)
  buildPropDiscs()
  buildStreamlines()
  applySurfaceColors()
  buildDragShell() // rebuild the red drag elements for the new pose (no-op if drag is off)
  computeAero()
  const e = new THREE.Euler().setFromQuaternion(model.quaternion, 'XYZ')
  const r2d = (r: number) => Math.round((r * 180) / Math.PI)
  orientInfo.value = { x: r2d(e.x), y: r2d(e.y), z: r2d(e.z) }
  if (refit) fitCamera(radius)
  else lastRadius = radius
}

const _q = new THREE.Quaternion()
const _v = new THREE.Vector3()

function setRotateMode(m: 'orbit' | 'model') {
  rotateMode.value = m
  if (!gizmo) return
  if (m === 'model' && model) {
    gizmo.attach(model)
    gizmo.enabled = true
    gizmo.visible = true
  } else {
    gizmo.detach()
    gizmo.enabled = false
    gizmo.visible = false
  }
}

/** Snap-rotate 90° about a world axis for precise alignment. */
function snap90(axis: 'x' | 'y' | 'z', sign: number) {
  if (!model) return
  _v.set(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
  _q.setFromAxisAngle(_v, (sign * Math.PI) / 2)
  orientQuat.premultiply(_q)
  model.quaternion.copy(orientQuat)
  rebuildModel(false)
}

function resetOrientation() {
  orientQuat.identity()
  if (model) model.quaternion.copy(orientQuat)
  rebuildModel(false)
}

function updateModelInfo(size: THREE.Vector3) {
  // Real size = geometry units × metres-per-unit (set by the unit selector).
  const m = metresPerUnit.value
  const dimsM = { x: size.x * m, y: size.y * m, z: size.z * m }
  modelInfo.value = { dimsM, frontalArea: dimsM.y * dimsM.z }
}

function updateSceneScale(size: THREE.Vector3, radius: number) {
  if (grid) { scene.remove(grid); grid.dispose() }
  grid = new THREE.GridHelper(radius * 5, 20, 0xc2c7d0, 0xdde1e8)
  grid.position.y = -size.y / 2 - radius * 0.05
  scene.add(grid)

  if (windArrow) scene.remove(windArrow)
  const len = radius * 2.4
  windArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-radius * 2.4, 0, 0),
    len, 0xef4444, len * 0.03, len * 0.015,
  )
  scene.add(windArrow)
}

/** "Nice" step (1/2/5 ×10^k) so a ruler shows evenly spaced, round ticks. */
function niceStep(raw: number): number {
  if (raw <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / p
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p
}

/** Format a length given in metres into the selected display unit. */
function fmtLen(metres: number): string {
  const u = modelUnits.value
  const v = metres / UNIT_TO_M[u]
  const s = u === 'm' ? v.toFixed(3) : u === 'in' ? v.toFixed(2) : u === 'cm' ? v.toFixed(1) : v.toFixed(0)
  return `${s} ${u}`
}

/**
 * Screen-fixed, zoom-aware scale rulers (like a Google-Maps scale bar):
 * tick spacing reflects real size at the current zoom, recomputed each frame.
 */
function updateRulers() {
  const canvas = renderer.domElement
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  // World units per screen pixel at the orbit target depth.
  const dist = camera.position.distanceTo(controls.target)
  const worldPerPx = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / H
  const mPerPx = worldPerPx * metresPerUnit.value
  const u = modelUnits.value
  // Nice step (~80 px between ticks) chosen in the display unit.
  const dispPerPx = mPerPx / UNIT_TO_M[u]
  const stepDisp = niceStep(dispPerPx * 80)
  const pxPerTick = stepDisp / dispPerPx
  if (!isFinite(pxPerTick) || pxPerTick < 6) { rulerX.value = []; rulerY.value = []; return }

  const xs: Array<{ p: number; label: string }> = []
  for (let i = 0; i * pxPerTick <= W && i <= 40; i++) {
    xs.push({ p: i * pxPerTick, label: i === 0 ? '0' : `${+(i * stepDisp).toFixed(3)}` })
  }
  const ys: Array<{ p: number; label: string }> = []
  for (let i = 0; i * pxPerTick <= H && i <= 40; i++) {
    ys.push({ p: i * pxPerTick, label: i === 0 ? '0' : `${+(i * stepDisp).toFixed(3)}` })
  }
  rulerX.value = xs
  rulerY.value = ys
  rulerUnit.value = u
}

let lastRadius = 1

function resetView() {
  fitCamera(lastRadius)
}

function downloadShot() {
  renderer.render(scene, camera)
  const a = document.createElement('a')
  a.href = renderer.domElement.toDataURL('image/png')
  a.download = `${(modelName.value || 'model').replace(/\s+/g, '-').toLowerCase()}.png`
  a.click()
}

function fitCamera(radius: number) {
  lastRadius = radius
  const fov = (camera.fov * Math.PI) / 180
  const distance = (radius / Math.sin(fov / 2)) * 1.15
  camera.near = Math.max(radius / 100, 0.001)
  camera.far = distance * 20
  camera.updateProjectionMatrix()
  const dir = new THREE.Vector3(0.9, 0.55, 1).normalize()
  camera.position.copy(dir.multiplyScalar(distance))
  controls.target.set(0, 0, 0)
  controls.update()
}

/* ---------------- Voxel occupancy + distance field ---------------- */

function buildField(box: THREE.Box3) {
  if (!model) { field = null; return }

  const size = box.getSize(new THREE.Vector3())
  const pad = Math.max(size.x, size.y, size.z) * 0.1
  const minX = box.min.x - pad, minY = box.min.y - pad, minZ = box.min.z - pad
  const ex = size.x + 2 * pad, ey = size.y + 2 * pad, ez = size.z + 2 * pad
  const maxDim = Math.max(ex, ey, ez)

  const N = 56
  const cell = maxDim / N
  const nx = Math.max(3, Math.ceil(ex / cell))
  const ny = Math.max(3, Math.ceil(ey / cell))
  const nz = Math.max(3, Math.ceil(ez / cell))
  const total = nx * ny * nz
  const solid = new Uint8Array(total)

  const idx = (ix: number, iy: number, iz: number) => ix + nx * (iy + ny * iz)
  const mark = (x: number, y: number, z: number) => {
    const ix = Math.floor((x - minX) / cell)
    const iy = Math.floor((y - minY) / cell)
    const iz = Math.floor((z - minZ) / cell)
    if (ix >= 0 && ix < nx && iy >= 0 && iy < ny && iz >= 0 && iz < nz) solid[idx(ix, iy, iz)] = 1
  }

  scene.updateMatrixWorld(true)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const p = new THREE.Vector3()
  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry || isInternal(mesh)) return
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    const index = mesh.geometry.index
    const triCount = index ? index.count / 3 : pos.count / 3
    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
      a.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld)
      const edge = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a))
      const steps = Math.min(8, Math.max(1, Math.ceil(edge / cell)))
      for (let u = 0; u <= steps; u++) {
        for (let v = 0; v <= steps - u; v++) {
          const bu = u / steps, bv = v / steps, bw = 1 - bu - bv
          p.set(
            a.x * bw + b.x * bu + c.x * bv,
            a.y * bw + b.y * bu + c.y * bv,
            a.z * bw + b.z * bu + c.z * bv,
          )
          mark(p.x, p.y, p.z)
        }
      }
    }
  })

  // Dilate by one cell so thin features form a watertight barrier.
  {
    const dil = new Uint8Array(total)
    for (let ix = 0; ix < nx; ix++)
      for (let iy = 0; iy < ny; iy++)
        for (let iz = 0; iz < nz; iz++) {
          if (!solid[idx(ix, iy, iz)]) continue
          dil[idx(ix, iy, iz)] = 1
          if (ix + 1 < nx) dil[idx(ix + 1, iy, iz)] = 1
          if (ix - 1 >= 0) dil[idx(ix - 1, iy, iz)] = 1
          if (iy + 1 < ny) dil[idx(ix, iy + 1, iz)] = 1
          if (iy - 1 >= 0) dil[idx(ix, iy - 1, iz)] = 1
          if (iz + 1 < nz) dil[idx(ix, iy, iz + 1)] = 1
          if (iz - 1 >= 0) dil[idx(ix, iy, iz - 1)] = 1
        }
    solid.set(dil)
  }

  // Flood-fill exterior; unreached empty cells are interior → solid.
  const visited = new Uint8Array(total)
  const stack: number[] = []
  const pushIf = (ix: number, iy: number, iz: number) => {
    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) return
    const k = idx(ix, iy, iz)
    if (!solid[k] && !visited[k]) { visited[k] = 1; stack.push(ix, iy, iz) }
  }
  for (let ix = 0; ix < nx; ix++)
    for (let iy = 0; iy < ny; iy++)
      for (let iz = 0; iz < nz; iz++)
        if (ix === 0 || iy === 0 || iz === 0 || ix === nx - 1 || iy === ny - 1 || iz === nz - 1)
          pushIf(ix, iy, iz)
  while (stack.length) {
    const iz = stack.pop()!, iy = stack.pop()!, ix = stack.pop()!
    pushIf(ix + 1, iy, iz); pushIf(ix - 1, iy, iz)
    pushIf(ix, iy + 1, iz); pushIf(ix, iy - 1, iz)
    pushIf(ix, iy, iz + 1); pushIf(ix, iy, iz - 1)
  }
  for (let k = 0; k < total; k++) if (!solid[k] && !visited[k]) solid[k] = 1

  // Wake bookkeeping: rear-most solid cell per (y,z) column + body centroid (the wake axis).
  const rearIx = new Int16Array(ny * nz).fill(-1)
  let sumIy = 0, sumIz = 0, cnt = 0
  for (let iz = 0; iz < nz; iz++)
    for (let iy = 0; iy < ny; iy++)
      for (let ix = 0; ix < nx; ix++)
        if (solid[idx(ix, iy, iz)]) {
          const col = iy + ny * iz
          if (ix > rearIx[col]) rearIx[col] = ix
          sumIy += iy; sumIz += iz; cnt++
        }
  const cy = cnt ? minY + (sumIy / cnt + 0.5) * cell : minY + ey / 2
  const cz = cnt ? minZ + (sumIz / cnt + 0.5) * cell : minZ + ez / 2

  // Distance field via multi-source BFS (capped).
  const dist = new Float32Array(total).fill(DIST_CAP)
  let frontier: number[] = []
  for (let ix = 0; ix < nx; ix++)
    for (let iy = 0; iy < ny; iy++)
      for (let iz = 0; iz < nz; iz++) {
        const k = idx(ix, iy, iz)
        if (solid[k]) { dist[k] = 0; frontier.push(ix, iy, iz) }
      }
  let d = 0
  while (frontier.length && d < DIST_CAP) {
    d++
    const next: number[] = []
    const relax = (ix: number, iy: number, iz: number) => {
      if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) return
      const k = idx(ix, iy, iz)
      if (dist[k] > d) { dist[k] = d; next.push(ix, iy, iz) }
    }
    for (let i = 0; i < frontier.length; i += 3) {
      const ix = frontier[i], iy = frontier[i + 1], iz = frontier[i + 2]
      relax(ix + 1, iy, iz); relax(ix - 1, iy, iz)
      relax(ix, iy + 1, iz); relax(ix, iy - 1, iz)
      relax(ix, iy, iz + 1); relax(ix, iy, iz - 1)
    }
    frontier = next
  }

  field = { ox: minX, oy: minY, oz: minZ, cell, nx, ny, nz, dist, rearIx, cy, cz }
}

function sampleDist(ix: number, iy: number, iz: number): number {
  if (!field) return DIST_CAP
  const { nx, ny, nz, dist } = field
  if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) return DIST_CAP
  return dist[ix + nx * (iy + ny * iz)]
}

function distWorld(x: number, y: number, z: number): number {
  if (!field) return DIST_CAP
  const { cell, ox, oy, oz } = field
  return sampleDist(Math.floor((x - ox) / cell), Math.floor((y - oy) / cell), Math.floor((z - oz) / cell))
}

// Trilinearly interpolated distance — a smooth, continuous field so the flow steers
// around the body cleanly instead of stair-stepping over the voxel grid.
function distLerp(x: number, y: number, z: number): number {
  if (!field) return DIST_CAP
  const { cell, ox, oy, oz } = field
  const fx = (x - ox) / cell - 0.5, fy = (y - oy) / cell - 0.5, fz = (z - oz) / cell - 0.5
  const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz)
  const tx = fx - ix, ty = fy - iy, tz = fz - iz
  const c000 = sampleDist(ix, iy, iz), c100 = sampleDist(ix + 1, iy, iz)
  const c010 = sampleDist(ix, iy + 1, iz), c110 = sampleDist(ix + 1, iy + 1, iz)
  const c001 = sampleDist(ix, iy, iz + 1), c101 = sampleDist(ix + 1, iy, iz + 1)
  const c011 = sampleDist(ix, iy + 1, iz + 1), c111 = sampleDist(ix + 1, iy + 1, iz + 1)
  const c00 = c000 + (c100 - c000) * tx, c10 = c010 + (c110 - c010) * tx
  const c01 = c001 + (c101 - c001) * tx, c11 = c011 + (c111 - c011) * tx
  const c0 = c00 + (c10 - c00) * ty, c1 = c01 + (c11 - c01) * ty
  return c0 + (c1 - c0) * tz
}

// Outward surface normal = gradient of the smooth distance field (points away from the body).
function surfGrad(x: number, y: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  if (!field) return out.set(1, 0, 0)
  const h = field.cell
  const gx = distLerp(x + h, y, z) - distLerp(x - h, y, z)
  const gy = distLerp(x, y + h, z) - distLerp(x, y - h, z)
  const gz = distLerp(x, y, z + h) - distLerp(x, y, z - h)
  const l = Math.hypot(gx, gy, gz)
  if (l < 1e-4) return out.set(1, 0, 0)
  return out.set(gx / l, gy / l, gz / l)
}

const INFLUENCE = 2.8

/** Build the propeller induced-flow discs in world space (drone only). */
function buildPropDiscs() {
  propDiscs = []
  if (!propPivots.length) return
  scene.updateMatrixWorld(true)
  propPivots.forEach((p, i) => {
    const c = new THREE.Vector3().setFromMatrixPosition(p.matrixWorld)
    const axis = new THREE.Vector3(0, 1, 0).transformDirection(p.matrixWorld).normalize()
    // spin sign must match the animation in animate()
    propDiscs.push({ c, axis, r: 50, spin: i % 2 === 0 ? 1 : -1 })
  })
}

/** Propeller slipstream: axial downwash plus the swirl (rotation) it imparts. */
function applyPropWash(x: number, y: number, z: number, out: THREE.Vector3) {
  for (const d of propDiscs) {
    const rx = x - d.c.x, ry = y - d.c.y, rz = z - d.c.z
    const axial = rx * d.axis.x + ry * d.axis.y + rz * d.axis.z
    const radial = Math.sqrt(Math.max(0, rx * rx + ry * ry + rz * rz - axial * axial))
    if (radial > d.r * 1.15) continue
    const below = d.r * 3.2
    let f = 0
    if (axial <= 0 && axial > -below) f = 1 + axial / below       // strong wash below the disc
    else if (axial > 0 && axial < d.r * 1.3) f = 0.4 * (1 - axial / (d.r * 1.3)) // inflow above
    if (f <= 0) continue
    const rr = radial / (d.r * 1.15)

    // Axial component — pushes air along −thrust axis.
    const s = 1.2 * f * Math.max(0, 1 - rr * rr)
    out.x -= d.axis.x * s
    out.y -= d.axis.y * s
    out.z -= d.axis.z * s

    // Swirl component — the slipstream rotates with the prop (tangent = axis × r̂).
    if (radial > 1e-3) {
      const inv = 1 / radial
      const rhx = (rx - axial * d.axis.x) * inv
      const rhy = (ry - axial * d.axis.y) * inv
      const rhz = (rz - axial * d.axis.z) * inv
      const tx = d.axis.y * rhz - d.axis.z * rhy
      const ty = d.axis.z * rhx - d.axis.x * rhz
      const tz = d.axis.x * rhy - d.axis.y * rhx
      // peaks at mid-radius, fades to the tip; only in the wash (axial ≤ ~0)
      const profile = Math.min(radial / (d.r * 0.5), 1) * Math.max(0, 1 - rr * rr) * Math.max(0, f)
      const sw = d.spin * 1.3 * profile
      out.x += tx * sw
      out.y += ty * sw
      out.z += tz * sw
    }
  }
}

function velocityAt(x: number, y: number, z: number, out: THREE.Vector3, wake = false): THREE.Vector3 {
  out.set(1, 0, 0)
  if (field) {
    const { cell } = field
    const dd = distLerp(x, y, z)
    if (dd < INFLUENCE) {
      const h = cell
      let nx = distLerp(x + h, y, z) - distLerp(x - h, y, z)
      let ny = distLerp(x, y + h, z) - distLerp(x, y - h, z)
      let nz = distLerp(x, y, z + h) - distLerp(x, y, z - h)
      let nlen = Math.hypot(nx, ny, nz)
      if (nlen < 1e-4) { nx = 0; ny = y; nz = z; nlen = Math.hypot(ny, nz) || 1 }
      nx /= nlen; ny /= nlen; nz /= nlen

      const w = (INFLUENCE - dd) / INFLUENCE
      // Fully tangent well before the wall so the flow never drives into the body.
      const remove = Math.min(1, w * 1.7)
      const dot = out.x * nx + out.y * ny + out.z * nz
      out.x -= remove * dot * nx
      out.y -= remove * dot * ny
      out.z -= remove * dot * nz

      let mag = out.length()
      if (mag < 0.05) {
        // Head-on stagnation: no tangential flow left. Give it a tangent to the surface
        // so it slips over/under (or around) the body instead of stalling and being cut.
        let tx = -nz, ty = 0, tz = nx              // n × up(0,1,0)
        if (tx * tx + tz * tz < 1e-4) { tx = 0; ty = nz; tz = -ny }
        out.set(tx, ty, tz)
        mag = out.length() || 1
      }
      // Restore and accelerate the speed so streamlines wrap around the body rather than
      // crawling to a stop — and so the suction regions over the wing/hull glow red.
      out.multiplyScalar((1 + 1.25 * w) / mag)
    }

    // Recirculating wake: behind the body the flow slows, partly reverses near the
    // base and curls back toward the wake axis — so streamlines wrap behind it.
    if (wake) {
      const { cell, ox, oy, oz, ny: gny, nz: gnz, rearIx, cy, cz } = field
      const ix = Math.floor((x - ox) / cell)
      const iy = Math.floor((y - oy) / cell)
      const iz = Math.floor((z - oz) / cell)
      if (iy >= 0 && iy < gny && iz >= 0 && iz < gnz) {
        const rear = rearIx[iy + gny * iz]
        const WAKE = 20
        if (rear >= 0 && ix > rear && ix - rear <= WAKE) {
          const t = (ix - rear) / WAKE          // 0 at the base → 1 at wake end
          const base = (1 - t) * (1 - t)         // strongest right behind the body
          // Gently slow the wake (no flow reversal) and smoothly converge the
          // streamlines back onto the wake axis — clean closing lines, no zig-zag.
          out.x = out.x * (0.5 + 0.5 * t)
          const ty = cy - y, tz = cz - z
          const tl = Math.hypot(ty, tz) || 1
          out.y += base * 0.45 * (ty / tl)
          out.z += base * 0.45 * (tz / tl)
        }
      }
    }
  }
  if (propDiscs.length) applyPropWash(x, y, z, out)
  return out
}

/* ---------------- Aerodynamic coefficients (surface integral) ---------------- */

// Accurate frontal (Y-Z) silhouette area in WORLD units², by rasterising every triangle's
// projection into a high-res 2D grid (union of coverage). Far better than the coarse voxel
// columns, which inflate thin wings/tails to a whole cell and overcount the area several-fold.
function frontalArea2D(): number {
  if (!model) return 0
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(model)
  const minY = box.min.y, minZ = box.min.z
  const sy = (box.max.y - minY) || 1e-6, sz = (box.max.z - minZ) || 1e-6
  const RES = 240
  const grid = new Uint8Array(RES * RES)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  let covered = 0
  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry || isInternal(mesh)) return
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    const index = mesh.geometry.index
    const tri = index ? index.count / 3 : pos.count / 3
    for (let t = 0; t < tri; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
      a.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld)
      // project to grid coordinates (y → rows, z → cols)
      const ay = (a.y - minY) / sy * RES, az = (a.z - minZ) / sz * RES
      const by = (b.y - minY) / sy * RES, bz = (b.z - minZ) / sz * RES
      const cy2 = (c.y - minY) / sy * RES, cz2 = (c.z - minZ) / sz * RES
      const iy0 = Math.max(0, Math.floor(Math.min(ay, by, cy2)))
      const iy1 = Math.min(RES - 1, Math.ceil(Math.max(ay, by, cy2)))
      const iz0 = Math.max(0, Math.floor(Math.min(az, bz, cz2)))
      const iz1 = Math.min(RES - 1, Math.ceil(Math.max(az, bz, cz2)))
      for (let iy = iy0; iy <= iy1; iy++) {
        const py = iy + 0.5
        for (let iz = iz0; iz <= iz1; iz++) {
          const pz = iz + 0.5
          const w0 = (by - ay) * (pz - az) - (bz - az) * (py - ay)
          const w1 = (cy2 - by) * (pz - bz) - (cz2 - bz) * (py - by)
          const w2 = (ay - cy2) * (pz - cz2) - (az - cz2) * (py - cy2)
          if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) {
            const k = iy * RES + iz
            if (!grid[k]) { grid[k] = 1; covered++ }
          }
        }
      }
    }
  })
  return covered * (sy / RES) * (sz / RES) // world units²
}

function computeAero() {
  if (!field || !model) {
    aero.value = { cd: 0, cdA: 0, cl: 0, clf: 0, clr: 0, ld: 0, area: 0 }
    return
  }
  const { nx, ny, nz, cell, dist } = field
  const unit = metresPerUnit.value // metres per geometry unit (from the unit selector)
  const LIFT_CIRC = 2.0 // weight of the inclined-surface (circulation-proxy) lift term
  const isSolid = (ix: number, iy: number, iz: number) => dist[ix + nx * (iy + ny * iz)] === 0

  // Front-depth silhouette: most-upstream solid cell per (y,z) column.
  // Using only the front surface avoids counting hidden/internal faces.
  const front = new Int32Array(ny * nz).fill(-1)
  for (let iy = 0; iy < ny; iy++)
    for (let iz = 0; iz < nz; iz++)
      for (let ix = 0; ix < nx; ix++)
        if (isSolid(ix, iy, iz)) { front[iy + ny * iz] = ix; break }
  const fx = (iy: number, iz: number) =>
    (iy < 0 || iy >= ny || iz < 0 || iz >= nz) ? -1 : front[iy + ny * iz]

  // Newtonian pressure drag: Cp ≈ cos²θ on each front facet → Cd = mean(nx²).
  // nx² = 1 / (1 + slopeY² + slopeZ²) from the front-surface gradient.
  let sumNx2 = 0, cols = 0
  for (let iy = 0; iy < ny; iy++)
    for (let iz = 0; iz < nz; iz++) {
      if (fx(iy, iz) < 0) continue
      cols++
      const fyp = fx(iy + 1, iz), fym = fx(iy - 1, iz), fzp = fx(iy, iz + 1), fzm = fx(iy, iz - 1)
      let sy = 0, sz = 0
      if (fyp >= 0 && fym >= 0) sy = (fyp - fym) / 2
      if (fzp >= 0 && fzm >= 0) sz = (fzp - fzm) / 2
      sumNx2 += 1 / (1 + sy * sy + sz * sz)
    }
  const cdPress = cols > 0 ? sumNx2 / cols : 0

  // Skin-friction drag: Cf · wetted/frontal area (wetted from exposed solid faces).
  let faces = 0
  for (let ix = 0; ix < nx; ix++)
    for (let iy = 0; iy < ny; iy++)
      for (let iz = 0; iz < nz; iz++) {
        if (!isSolid(ix, iy, iz)) continue
        if (ix === 0 || !isSolid(ix - 1, iy, iz)) faces++
        if (ix === nx - 1 || !isSolid(ix + 1, iy, iz)) faces++
        if (iy === 0 || !isSolid(ix, iy - 1, iz)) faces++
        if (iy === ny - 1 || !isSolid(ix, iy + 1, iz)) faces++
        if (iz === 0 || !isSolid(ix, iy, iz - 1)) faces++
        if (iz === nz - 1 || !isSolid(ix, iy, iz + 1)) faces++
      }
  const cdFric = cols > 0 ? 0.012 * faces / cols : 0

  // Base (wake) drag: a blunt rear face leaves a low-pressure separated wake.
  // Mirror of the front silhouette — use the rear-most cell per column and its
  // slope; flat bases (slope≈0) drag, tapered/pointed tails (steep slope) don't.
  const back = new Int32Array(ny * nz).fill(-1)
  for (let iy = 0; iy < ny; iy++)
    for (let iz = 0; iz < nz; iz++)
      for (let ix = nx - 1; ix >= 0; ix--)
        if (isSolid(ix, iy, iz)) { back[iy + ny * iz] = ix; break }
  const bx = (iy: number, iz: number) =>
    (iy < 0 || iy >= ny || iz < 0 || iz >= nz) ? -1 : back[iy + ny * iz]
  let sumBack = 0
  for (let iy = 0; iy < ny; iy++)
    for (let iz = 0; iz < nz; iz++) {
      if (bx(iy, iz) < 0) continue
      const byp = bx(iy + 1, iz), bym = bx(iy - 1, iz), bzp = bx(iy, iz + 1), bzm = bx(iy, iz - 1)
      let sy = 0, sz = 0
      if (byp >= 0 && bym >= 0) sy = (byp - bym) / 2
      if (bzp >= 0 && bzm >= 0) sz = (bzp - bzm) / 2
      sumBack += 1 / (1 + sy * sy + sz * sz)
    }
  const cdBase = cols > 0 ? 0.16 * (sumBack / cols) : 0

  // Newtonian impact theory is a HYPERSONIC model and badly overestimates subsonic pressure
  // drag (ideal subsonic flow has ~none — d'Alembert). Apply a subsonic correction so the
  // pressure term contributes a realistic share; total Cd lands in the light-aircraft range
  // (~0.25–0.35 on frontal area). This is the calibration knob.
  const SUBSONIC_PRESS = 0.18
  let cd = SUBSONIC_PRESS * cdPress + cdFric + cdBase
  cd = Math.max(0.03, Math.min(2.0, cd))

  const frontalWorld = Math.max(frontalArea2D(), 1e-6) // accurate silhouette (world units²)
  const area = frontalWorld * unit * unit // m²

  // Lift from top/bottom pressure asymmetry of the flow field (over the surface).
  let cl = 0, clf = 0, clr = 0
  const off = cell * 1.2
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3(), v = new THREE.Vector3()
  scene.updateMatrixWorld(true)
  let fl = 0, flf = 0, flr = 0
  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry || isInternal(mesh)) return
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    const index = mesh.geometry.index
    const tri = index ? index.count / 3 : pos.count / 3
    for (let t = 0; t < tri; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
      a.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld)
      ab.subVectors(b, a); ac.subVectors(c, a); n.crossVectors(ab, ac)
      const area2 = n.length()
      if (area2 < 1e-9) continue
      const area_ = area2 * 0.5
      n.multiplyScalar(1 / area2)
      const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3, cz = (a.z + b.z + c.z) / 3
      velocityAt(cx + n.x * off, cy + n.y * off, cz + n.z * off, v)
      const speed = v.length()
      const cp = Math.max(-1.5, Math.min(1, 1 - speed * speed))
      let dLift = -cp * n.y * area_
      // Newtonian inclined-surface lift: a windward (pressure) face turns the flow and
      // produces a force ⟂ to it. Gives wings / cambered bodies a meaningful Cl of the
      // right sign (down-force for a leading-edge-down wing); cancels on symmetric bodies.
      if (n.x > 0.02) dLift += -(n.x * n.x) * n.y * area_ * LIFT_CIRC
      fl += dLift
      if (cx < 0) flf += dLift; else flr += dLift
    }
  })
  cl = fl / frontalWorld
  clf = flf / frontalWorld
  clr = flr / frontalWorld

  const ld = cd > 1e-6 ? cl / cd : 0
  aero.value = { cd, cdA: cd * area, cl, clf, clr, ld, area }
}

/* ---------------- Surface field ---------------- */

const SURF_RAMP: Array<[number, [number, number, number]]> = [
  [0.0, [0.05, 0.20, 0.85]],
  [0.25, [0.0, 0.75, 0.95]],
  [0.5, [0.15, 0.80, 0.25]],
  [0.75, [0.97, 0.85, 0.10]],
  [1.0, [0.93, 0.16, 0.12]],
]
function surfColor(t: number, out: { r: number; g: number; b: number }) {
  t = Math.min(1, Math.max(0, t))
  for (let i = 1; i < SURF_RAMP.length; i++) {
    if (t <= SURF_RAMP[i][0]) {
      const [t0, c0] = SURF_RAMP[i - 1], [t1, c1] = SURF_RAMP[i]
      const f = (t - t0) / (t1 - t0)
      out.r = c0[0] + (c1[0] - c0[0]) * f
      out.g = c0[1] + (c1[1] - c0[1]) * f
      out.b = c0[2] + (c1[2] - c0[2]) * f
      return
    }
  }
  out.r = 0.93; out.g = 0.16; out.b = 0.12
}

function applySurfaceColors() {
  if (!model) return
  const mode = surfaceMode.value
  const off = field ? field.cell * 1.2 : 0
  const v = new THREE.Vector3()
  const wp = new THREE.Vector3()
  const wn = new THREE.Vector3()
  const normalMat = new THREE.Matrix3()
  const col = { r: 0, g: 0, b: 0 }
  scene.updateMatrixWorld(true)

  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    if (mode === 'none') {
      mesh.material = roleMaterial(mesh.userData?.role)
      return
    }
    if (isInternal(mesh)) return // keep internals as-is in coloured views
    const geo = mesh.geometry
    const pos = geo.attributes.position
    const nor = geo.attributes.normal
    if (!pos || !nor) return
    normalMat.getNormalMatrix(mesh.matrixWorld)
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      wp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
      wn.fromBufferAttribute(nor, i).applyMatrix3(normalMat).normalize()
      velocityAt(wp.x + wn.x * off, wp.y + wn.y * off, wp.z + wn.z * off, v)
      if (mode === 'pressure') {
        // Pressure coefficient driven by how much the surface faces the wind (+X):
        // front-facing grains → high pressure (red), sides → ~0 (green), leeward → suction (blue).
        const cp = Math.max(-1, Math.min(1, -wn.x * 1.2))
        surfColor((cp + 1) / 2, col)
      } else if (mode === 'heat') {
        // Aerodynamic heating peaks where the flow stagnates against the surface — the
        // air's kinetic energy is recovered as heat. Front-facing facets (normal into
        // the wind) reach the full stagnation temperature ambient+ΔT_stag; tangential
        // and leeward faces sit near the recovery temperature ambient+r·ΔT_stag. We key
        // off geometry (how much the normal faces upwind), the same robust signal the
        // pressure view uses — the near-wall flow speed is deliberately accelerated for
        // the streamlines, so it can't be used to detect stagnation here.
        const stag = Math.max(0, -wn.x)   // 1 = straight into the wind, 0 = side/leeward
        surfColor(Math.pow(stag, 0.7), col)
      } else {
        const dot = v.x * wn.x + v.y * wn.y + v.z * wn.z
        const ts = Math.hypot(v.x - dot * wn.x, v.y - dot * wn.y, v.z - dot * wn.z)
        surfColor(Math.min(1, ts / 1.5), col)
      }
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    mesh.material = new THREE.MeshStandardMaterial({
      vertexColors: true, color: 0xffffff, metalness: 0.0, roughness: 0.75, side: THREE.DoubleSide,
    })
  })
}

// Smooth 0→1 ramp between two edges (Hermite).
function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/* ---------------- Drag trails (red streaks trailing downstream from high-drag areas) ------- */

let dragTrails: { lines: LineSegments2[]; materials: LineMaterial[] } | null = null

// Per-trail width is tapered by drawing each segment in the nearest of these pixel widths —
// thick near the (strong-drag) root, thin as the streak trails downstream.
const DRAG_WIDTHS = [1.5, 3.5, 6, 9, 13, 18]

function clearDragShell() {
  if (!dragTrails) return
  for (const l of dragTrails.lines) { scene.remove(l); l.geometry.dispose() }
  for (const m of dragTrails.materials) m.dispose()
  dragTrails = null
}

// Local drag density (0..1) — the physical streamwise force per area on this surface element:
//   • pressure drag: −Cp·n_x.  With the Newtonian Cp ≈ −1.2·n_x this becomes ≈ 1.2·n_x², so it
//     lights up both the windward fronts AND the blunt rear/base faces (donny drag), while
//     flow-aligned sides (n_x≈0) stay clean.
//   • skin friction: c_f · streamwise shear, from the local near-surface flow speed.
// Summed over the whole surface this is exactly the total Cd the panel reports.
function dragAt(wn: THREE.Vector3, v: THREE.Vector3): number {
  const press = Math.min(1, 1.2 * wn.x * wn.x)
  const dot = v.x * wn.x + v.y * wn.y + v.z * wn.z
  const ts = Math.hypot(v.x - dot * wn.x, v.y - dot * wn.y, v.z - dot * wn.z)
  const fric = 0.12 * Math.min(1, ts / 1.5)
  return Math.min(1, press + fric)
}

// Draw drag as red streaks that TRAIL DOWNSTREAM along the wind: from each high-drag surface
// patch we trace a short streamline (following the flow, so it wraps over the body and into
// the wake) and draw it red. The trail is longer where the local drag is higher — so you see
// how much drag each feature drags into the airflow.
function buildDragShell() {
  clearDragShell()
  if (!showDrag.value || !model || !field) return
  const cell = field.cell
  const off = cell * 0.25 // start right on the skin so the trail is attached to the object
  const ds = cell * 0.95
  const wp = new THREE.Vector3()
  const wn = new THREE.Vector3()
  const p = new THREE.Vector3()
  const v = new THREE.Vector3()
  const g = new THREE.Vector3()
  const normalMat = new THREE.Matrix3()
  scene.updateMatrixWorld(true)

  // one position/color bucket per width band (thick → thin)
  const bands = DRAG_WIDTHS.map(() => ({ pos: [] as number[], col: [] as number[] }))
  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry || isInternal(mesh)) return
    const geo = mesh.geometry
    const pos = geo.attributes.position
    const nor = geo.attributes.normal
    if (!pos || !nor) return
    normalMat.getNormalMatrix(mesh.matrixWorld)
    const stride = Math.max(1, Math.floor(pos.count / 2600)) // dense seeds → streaks merge into a solid clump
    for (let i = 0; i < pos.count; i += stride) {
      wn.fromBufferAttribute(nor, i).applyMatrix3(normalMat).normalize()
      wp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
      p.copy(wp).addScaledVector(wn, off)
      velocityAt(p.x, p.y, p.z, v, true)
      const d = dragAt(wn, v)                         // physical local drag density
      if (d < 0.45) continue
      const steps = Math.round(1 + d * 4)           // very short — a stubby cone of drag
      const rootW = 7 + 11 * d                       // big root where drag is stronger
      for (let k = 0; k < steps; k++) {
        velocityAt(p.x, p.y, p.z, v, true)
        const sp = v.length() || 1
        let nx = p.x + (v.x / sp) * ds, ny = p.y + (v.y / sp) * ds, nz = p.z + (v.z / sp) * ds
        // hug the surface: if the step dives into the body, slide back out along the normal
        if (distWorld(nx, ny, nz) <= 0) {
          surfGrad(nx, ny, nz, g)
          nx += g.x * cell * 0.8; ny += g.y * cell * 0.8; nz += g.z * cell * 0.8
          if (distWorld(nx, ny, nz) <= 0) break
        }
        const f = 1 - k / steps                   // 1 at the root → 0 at the tip
        // pick the width band: big at the root, tapering to a point like a cone
        const w = (0.08 + 0.92 * f) * rootW
        let bi = 0
        for (let j = DRAG_WIDTHS.length - 1; j >= 0; j--) { if (w >= DRAG_WIDTHS[j] - 0.6) { bi = j; break } }
        const b = bands[bi]
        const r0 = 0.86, g0 = 0.13 * (1 - f) + 0.07, b0 = 0.11 * (1 - f) + 0.05
        b.pos.push(p.x, p.y, p.z, nx, ny, nz)
        b.col.push(r0, g0, b0, r0, g0, b0)
        p.set(nx, ny, nz)
      }
    }
  })

  const canvas = renderer.domElement
  const lines: LineSegments2[] = []
  const materials: LineMaterial[] = []
  bands.forEach((b, bi) => {
    if (!b.pos.length) return
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(new Float32Array(b.pos))
    geometry.setColors(new Float32Array(b.col))
    const material = new LineMaterial({ linewidth: DRAG_WIDTHS[bi], vertexColors: true, transparent: true, opacity: 0.95 })
    material.resolution.set(canvas.clientWidth, canvas.clientHeight)
    const line = new LineSegments2(geometry, material)
    scene.add(line)
    lines.push(line); materials.push(material)
  })
  if (lines.length) dragTrails = { lines, materials }
}

function setSurfaceMode(m: 'none' | 'pressure' | 'friction' | 'heat') {
  surfaceMode.value = m   // surface coloring is independent of the drag elements
  applySurfaceColors()
}

// Streamlines and the drag trails live in the same Flow group → mutually exclusive.
function toggleStreamlines() {
  showFlow.value = !showFlow.value
  if (showFlow.value && showDrag.value) { showDrag.value = false; clearDragShell() }
  toggleFlow()
}

function toggleDrag() {
  showDrag.value = !showDrag.value
  if (showDrag.value && showFlow.value) { showFlow.value = false; toggleFlow() } // turn streamlines off
  buildDragShell()
}

/* ---------------- Streamlines ---------------- */

// Vivid jet velocity colormap (reads well on the light viewport).
const RAMP: Array<[number, [number, number, number]]> = [
  [0.0, [0.13, 0.45, 1.0]],
  [0.25, [0.0, 0.78, 0.98]],
  [0.5, [0.22, 0.88, 0.34]],
  [0.75, [1.0, 0.80, 0.10]],
  [1.0, [1.0, 0.27, 0.18]],
]
function speedColor(rel: number, out: { r: number; g: number; b: number }) {
  const t = Math.min(1, Math.max(0, rel / 2))
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1], [t1, c1] = RAMP[i]
      const f = (t - t0) / (t1 - t0)
      out.r = c0[0] + (c1[0] - c0[0]) * f
      out.g = c0[1] + (c1[1] - c0[1]) * f
      out.b = c0[2] + (c1[2] - c0[2]) * f
      return
    }
  }
  out.r = 0.90; out.g = 0.16; out.b = 0.12
}

function makeLineLayer(
  segPos: number[], segCol: number[], _maxDim: number, linewidth: number, opacity: number,
): { line: LineSegments2; material: LineMaterial } | null {
  if (segPos.length === 0) return null
  const geometry = new LineSegmentsGeometry()
  geometry.setPositions(new Float32Array(segPos))
  geometry.setColors(new Float32Array(segCol))

  const canvas = renderer.domElement
  const material = new LineMaterial({
    linewidth, vertexColors: true, transparent: true, opacity, dashed: false,
  })
  material.resolution.set(canvas.clientWidth, canvas.clientHeight)

  const line = new LineSegments2(geometry, material)
  line.visible = showFlow.value
  scene.add(line)
  return { line, material }
}

function buildStreamlines() {
  const box = currentBox
  if (!box) return
  if (streamlines) {
    for (const l of streamlines.lines) { scene.remove(l); l.geometry.dispose() }
    for (const m of streamlines.materials) m.dispose()
    streamlines = null
  }

  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const startX = -size.x * 2.0    // start well upstream so lines enter from off-screen, not a cut plane
  const endX = size.x * 3.0       // trace further downstream so the wake is long & visible
  const cell = field ? field.cell : maxDim / 50
  const ds = cell * 0.8
  const maxSteps = Math.min(1400, Math.ceil((endX - startX) / ds) + 40)
  const mode = flowMode.value

  const hotPos: number[] = [], hotCol: number[] = []
  const ctxPos: number[] = [], ctxCol: number[] = []
  const v = new THREE.Vector3()
  const g = new THREE.Vector3()
  const col = { r: 0, g: 0, b: 0 }
  const px: number[] = [], py: number[] = [], pz: number[] = []
  const cr: number[] = [], cg: number[] = [], cb: number[] = []

  // Lines are seeded in the chosen slice plane but always traced in full 3D, so they
  // wrap up over / down under (and around) the body like the real flow — never confined
  // to the plane (which would make them stall and get cut at a blunt front).
  const trace = (y0: number, z0: number) => {
    let x = startX, y = y0, z = z0
    px.length = 0; py.length = 0; pz.length = 0
    cr.length = 0; cg.length = 0; cb.length = 0
    let maxDeflect = 0, maxSpeedDev = 0, stopped = false
    for (let step = 0; step < maxSteps && x <= endX; step++) {
      velocityAt(x, y, z, v, true)
      const speed = v.length() || 1
      speedColor(speed, col)
      px.push(x); py.push(y); pz.push(z)
      cr.push(col.r); cg.push(col.g); cb.push(col.b)
      maxDeflect = Math.max(maxDeflect, Math.abs(y - y0), Math.abs(z - z0))
      maxSpeedDev = Math.max(maxSpeedDev, Math.abs(speed - 1))
      if (speed < 0.04) { stopped = true; break }
      const inv = ds / speed
      let nx = x + v.x * inv, nyy = y + v.y * inv, nz = z + v.z * inv
      // If the step would enter the body, slide along the surface instead of stopping:
      // strip the inward velocity component and nudge back outside, so the line wraps
      // around the model (over/under) and keeps flowing — no chopped-off streamlines.
      let guard = 0
      while (distLerp(nx, nyy, nz) < 0.35 && guard < 6) {
        surfGrad(nx, nyy, nz, g)
        const vn = v.x * g.x + v.y * g.y + v.z * g.z
        v.x -= vn * g.x; v.y -= vn * g.y; v.z -= vn * g.z
        const sp = v.length() || 1
        const iv = ds / sp
        // step tangentially, then ride back up to a smooth ~0.35-cell standoff off the skin
        const lift = (0.35 - distLerp(nx, nyy, nz)) * 0.8 * cell
        nx = x + v.x * iv + g.x * lift
        nyy = y + v.y * iv + g.y * lift
        nz = z + v.z * iv + g.z * lift
        guard++
      }
      if (distWorld(nx, nyy, nz) <= 0) { stopped = true; break }
      x = nx; y = nyy; z = nz
    }
    return { maxDeflect, maxSpeedDev, stopped }
  }
  const emit = (tgtPos: number[], tgtCol: number[]) => {
    for (let i = 1; i < px.length; i++) {
      tgtPos.push(px[i - 1], py[i - 1], pz[i - 1], px[i], py[i], pz[i])
      tgtCol.push(cr[i - 1], cg[i - 1], cb[i - 1], cr[i], cg[i], cb[i])
    }
  }

  const lines: LineSegments2[] = []
  const materials: LineMaterial[] = []
  const unit = metresPerUnit.value // slice position in metres (geometry units → metres)

  if (mode === 'volume') {
    const hy = (size.y / 2) * 1.2
    const hz = (size.z / 2) * 1.2
    const rows = 9, cols = 18     // seed grid (fewer, thicker lines)
    const deflectThresh = cell * 1.5, speedThresh = 0.12
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const y0 = -hy + (2 * hy * (r + 0.5)) / rows
        const z0 = -hz + (2 * hz * (c + 0.5)) / cols
        const m = trace(y0, z0)
        // keep every line — interacting ones bright, free-stream ones as faint context
        const interacts = m.maxDeflect > deflectThresh || m.maxSpeedDev > speedThresh || m.stopped
        if (interacts) emit(hotPos, hotCol); else emit(ctxPos, ctxCol)
      }
    }
    const ctx = makeLineLayer(ctxPos, ctxCol, maxDim, 1.4, 0.5)
    if (ctx) { lines.push(ctx.line); materials.push(ctx.material) }
    const hot = makeLineLayer(hotPos, hotCol, maxDim, 3.2, 1.0)
    if (hot) { lines.push(hot.line); materials.push(hot.material) }
  } else if (mode === 'sliceZ') {
    const zc = (slicePos.value - 0.5) * size.z
    sliceWorldM.value = zc * unit
    const n = 55
    const hy = (size.y / 2) * 1.35
    for (let i = 0; i < n; i++) {
      const y0 = -hy + (2 * hy * (i + 0.5)) / n
      trace(y0, zc)
      emit(hotPos, hotCol)
    }
    const hot = makeLineLayer(hotPos, hotCol, maxDim, 3.6, 1.0)
    if (hot) { lines.push(hot.line); materials.push(hot.material) }
  } else {
    const yc = (slicePos.value - 0.5) * size.y
    sliceWorldM.value = yc * unit
    const n = 55
    const hz = (size.z / 2) * 1.2
    for (let i = 0; i < n; i++) {
      const z0 = -hz + (2 * hz * (i + 0.5)) / n
      trace(yc, z0)
      emit(hotPos, hotCol)
    }
    const hot = makeLineLayer(hotPos, hotCol, maxDim, 3.6, 1.0)
    if (hot) { lines.push(hot.line); materials.push(hot.material) }
  }

  streamlines = { lines, materials, maxDim }
}

function setFlowMode(m: 'volume' | 'sliceY' | 'sliceZ') {
  if (!showFlow.value) return
  flowMode.value = m
  buildStreamlines()
}

function onSliceChange() {
  buildStreamlines()
}

function animate() {
  frameId = requestAnimationFrame(animate)
  const dt = clock.getDelta()
  for (let i = 0; i < propPivots.length; i++) {
    propPivots[i].rotateY((i % 2 === 0 ? 1 : -1) * 26 * dt)
  }
  if (gimbalPivot) {
    // Sweep the nose camera up ↔ forward ↔ down (pitch in the vertical plane).
    gimbalPhase += dt
    gimbalPivot.rotation.z = Math.sin(gimbalPhase * 0.7) * 0.7
  }
  if (flapAnim.value && flapPivots.length) {
    // Control-surface check: run all flaps up ↔ neutral ↔ down through their range.
    flapPhase += dt
    const deg = Math.sin(flapPhase * 1.4) * 25
    const a = (deg * Math.PI) / 180
    for (const f of flapPivots) f.rotation.y = a
    flapDeg.value = Math.round(deg)
  }
  controls.update()
  renderer.render(scene, camera)

  // Refresh the screen rulers only when zoom / size / unit actually changed.
  const key = `${Math.round(camera.position.distanceTo(controls.target))}|${renderer.domElement.clientWidth}|${renderer.domElement.clientHeight}|${modelUnits.value}`
  if (key !== rulerKey) { rulerKey = key; updateRulers() }
}

function onWindowResize() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  if (!canvas) return
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  if (streamlines)
    for (const m of streamlines.materials) m.resolution.set(canvas.clientWidth, canvas.clientHeight)
  if (dragTrails)
    for (const m of dragTrails.materials) m.resolution.set(canvas.clientWidth, canvas.clientHeight)
}


function toggleFlow() {
  if (streamlines) for (const l of streamlines.lines) l.visible = showFlow.value
}
</script>
