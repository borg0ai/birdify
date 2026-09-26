<script setup lang="ts">
import { CHECK_COMMAND, DEMO_URL, FEEDBACK_URL, GITHUB_URL, INSTALL_COMMAND, LICENSE_URL, TOPICS } from './content.js';
import { asset, useSiteLocale } from './language.js';
import InstallSteps from './InstallSteps.vue';

const { copy, toggleLocale } = useSiteLocale();
</script>

<template>
  <header class="nav shell">
    <a class="brand" href="."><img :src="asset('brand/logo-192.png')" alt="Birdify logo"><span>Birdify</span></a>
    <nav>
      <a :href="GITHUB_URL">GitHub</a>
      <a :href="DEMO_URL">Live demo</a>
      <button type="button" aria-label="切换语言" @click="toggleLocale">{{ copy.navLanguage }}</button>
    </nav>
  </header>

  <main>
    <section class="hero shell">
      <div class="hero-copy">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.headlineBefore }}<em>{{ copy.headlineEm }}</em></h1>
        <p class="lede">{{ copy.ledeBefore }}<br>{{ copy.ledeAfter }}</p>
        <div class="actions">
          <a class="button primary" href="#install">{{ copy.cta }}</a>
          <a class="button secondary" :href="DEMO_URL">{{ copy.demo }}</a>
        </div>
        <div class="topics" aria-label="Project topics"><span v-for="topic in TOPICS" :key="topic">{{ topic }}</span></div>
      </div>
      <div class="hero-art">
        <div class="halo"></div>
        <img :src="asset('brand/logo-512.png')" alt="Birdify bird mascot">
        <p>{{ copy.artCaptionBefore }}<br><strong>{{ copy.artCaptionStrong }}</strong></p>
      </div>
    </section>

    <section class="preview shell">
      <div class="section-heading"><p class="eyebrow">{{ copy.previewEyebrow }}</p><h2>{{ copy.previewTitle }}</h2></div>
    </section>

    <section class="features shell">
      <article v-for="(feature, index) in copy.features" :key="feature.title">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.body }}</p>
      </article>
    </section>

    <InstallSteps :install-command="INSTALL_COMMAND" :check-command="CHECK_COMMAND" />

    <section class="community shell" aria-labelledby="community-title">
      <div>
        <p class="eyebrow">{{ copy.communityEyebrow }}</p>
        <h2 id="community-title">{{ copy.communityTitle }}</h2>
        <p>{{ copy.communityBody }}</p>
        <p class="community-number">{{ copy.communityNumber }}</p>
        <a :href="FEEDBACK_URL">{{ copy.communityFeedback }}</a>
      </div>
    </section>

    <section class="closing shell">
      <div>
        <p class="eyebrow">{{ copy.closingEyebrow }}</p>
        <h2>{{ copy.closingTitle }}</h2>
        <p>{{ copy.closingBody }}</p>
      </div>
      <a class="button primary" :href="GITHUB_URL">{{ copy.closingCta }}</a>
    </section>
  </main>
  <footer class="shell"><span>© 2026 Qiuner · Birdify</span><a :href="LICENSE_URL">MIT License</a></footer>
</template>
