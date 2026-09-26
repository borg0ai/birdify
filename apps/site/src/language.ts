import { computed, ref } from 'vue';
import { COPY, type Locale, type SiteCopy } from './content.js';

const locale = ref<Locale>('en');

export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function useSiteLocale() {
  const copy = computed<SiteCopy>(() => COPY[locale.value]);

  function toggleLocale(): void {
    locale.value = locale.value === 'zh' ? 'en' : 'zh';
    document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';
    document.title = copy.value.title;
  }

  return { locale, copy, toggleLocale };
}
