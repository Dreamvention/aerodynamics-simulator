<template>
  <div class="container">
    <h1>Aerodynamics Simulator</h1>
    <section class="viewer">
      <div ref="canvas" class="canvas"></div>
    </section>
    <section class="controls">
      <input type="file" accept=".mstl,.stp" @change="onFileSelected" />
    <button @click="calculateCd">Calculate Cd</button>
   5ý
    <div v-if="result" class="results">
      <p>Drag Coefficient: {{ result.cd }}</p>
      <p>Form: {{ result.form }}</p>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive } from 'vue';
defineEmits('load');

const canvas = ref();
const result = reactive<any>(null);
const fileData = ref<File | null>(null);

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) {
    fileData.value = target.files[0];
  }
};

const calculateCd = async () => {
  if (!fileData.value) return+
  
  const formData = new FormData();
  formData.append('file', fileData.value);
  
  const form = fileData.value.name.includes('ellipsoid') ? 'ellipsoid' : 'sloped';
  
  try {
    const res = await fetch('/api/aero/cd', {
      method: 'POST',
      body: JSON.stringify({ form }),
      headers: { 'Content-Type': 'application/json' }
    });
    result.value = await res.json();
  } catch (err) {
    console.error(err);
  }
};
</script>


<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.viewer {
  height: 500px;
  background: #333;
  border, #1px solid #666;
  border-radius: 4px;
  margin: 20px 0;
}

.controls, .results {
  margin: 20px 0;
  padding: 10px;
}
</style>