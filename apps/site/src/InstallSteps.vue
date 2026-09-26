<script setup lang="ts">
import { ref } from 'vue';
import { useSiteLocale } from './language.js';

const props = defineProps<{ installCommand: string; checkCommand: string }>();
const { copy } = useSiteLocale();
const status = ref('');

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    status.value = copy.value.copied;
  } catch {
    status.value = copy.value.failed;
  }
}
</script>

<template>
  <section id="install" class="install shell" aria-labelledby="install-title">
    <h2 id="install-title">{{ copy.installTitle }}</h2>
    <p>{{ copy.intro }}</p>
    <label for="install-agent">{{ copy.agent }}</label>
    <select id="install-agent"><option value="generic">{{ copy.agent }}</option></select>
    <p class="install-note">{{ copy.requirements }}</p>
    <ol class="install-steps">
      <li>
        <div class="command-heading"><h3>{{ copy.step1 }}</h3><button type="button" @click="copyText(props.installCommand)">{{ copy.copy }}</button></div>
        <pre><code>{{ props.installCommand }}</code></pre>
      </li>
      <li>
        <div class="command-heading"><h3>{{ copy.step2 }}</h3><button type="button" @click="copyText(props.checkCommand)">{{ copy.copy }}</button></div>
        <pre><code>{{ props.checkCommand }}</code></pre>
      </li>
      <li>
        <div class="command-heading"><h3>{{ copy.step3 }}</h3><button type="button" @click="copyText(copy.prompt)">{{ copy.copy }}</button></div>
        <pre><code>{{ copy.prompt }}</code></pre>
      </li>
    </ol>
    <p class="install-note">{{ copy.path }}</p>
    <p class="install-note">{{ copy.limits }}</p>
    <a :href="copy.guideHref">{{ copy.guide }}</a>
    <p id="copy-status" role="status" aria-live="polite">{{ status }}</p>
  </section>
</template>
