<script setup lang="ts">
import { computed, onMounted, ref, inject, type Ref } from 'vue';
import { net } from '@/utils/network';
import { useSettingsStore } from '@/stores/settings';
import Checkbox from '@/components/Checkbox.vue';

const settingsStore = useSettingsStore();

const sourcifySuccess = ref('');
const sourcifyWarning = ref('');
const rememberSourcify = ref(false);
const checkingSourcify = ref(false);

const isSourcifyUrlInLocalStorage = () => !!localStorage.getItem('sourcifyUrl')?.length;

onMounted(() => {
  rememberSourcify.value = isSourcifyUrlInLocalStorage();
});

const checkSourcifyConnect = async () => {
  checkingSourcify.value = true;
  sourcifyWarning.value = '';
  sourcifySuccess.value = '';

  if (!settingsStore.sourcifyUrl) {
    showSourcifyWarning('Please provide Sourcify archive URL');
    return;
  }

  let json = await net(`${settingsStore.sourcifyUrl}/full_match`);
  if (json && json.ok) {
    showSourcifySuccess('Server responded successfully');
    checkingSourcify.value = false;
    return;
  }

  json = await net(`${settingsStore.sourcifyUrl}/partial_match`);
  if (json && json.ok) {
    showSourcifySuccess('Server responded successfully');
    checkingSourcify.value = false;
    return;
  }

  showSourcifyWarning(
    'Failed to connect to Sourcify archive URL or no "partial_match" or "full_match" directories in archive root were found'
  );
  checkingSourcify.value = false;
};

const showSourcifyWarning = (msg: string) => {
  sourcifyWarning.value = msg;
};

const showSourcifySuccess = (msg: string) => {
  sourcifySuccess.value = msg;
  setTimeout(() => {
    sourcifySuccess.value = '';
  }, 7000);
};

const handleSourcifyUrlInput = () => {
  if (rememberSourcify.value) {
    localStorage.setItem('sourcifyUrl', settingsStore.sourcifyUrl);
  }
  if (!settingsStore.sourcifyUrl.length) {
    localStorage.removeItem('sourcifyUrl');
  }
};

const handleRememberMeSourcify = () => {
  if (rememberSourcify.value) {
    localStorage.removeItem('sourcifyUrl');
  } else if (settingsStore.sourcifyUrl.length) {
    localStorage.setItem('sourcifyUrl', settingsStore.sourcifyUrl);
  }
  rememberSourcify.value = !rememberSourcify.value;
};
</script>

<template>
  <div>
    <h4 class="sourcify-header">
      <img class="sourcify-icon" src="@/assets/sourcify.svg" alt="Sourcify logo" />
      Sourcify
    </h4>
    <div class="description">
      <p>
        Sourcify (<a target="_blank" href="https://sourcify.dev/">homepage</a>) allows to see extra
        information about contracts on ESPLR (name, ABI, methods, language, compiler details, etc.).
      </p>
      <p>
        To enable integration, provide an URL to a Sourcify instance. Check out esplr README for
        setup guidance.
      </p>
    </div>
    <div class="soucify-field">
      <input
        type="text"
        v-model.trim="settingsStore.sourcifyUrl"
        @input="handleSourcifyUrlInput"
        placeholder="Sourcify archive URL"
        class="text-input"
      />
      <button @click="checkSourcifyConnect" class="btn btn-dark check-sourcify-btn">
        <span v-if="checkingSourcify" class="spinner"></span>
        <span v-else>Check</span>
      </button>
    </div>
    <div class="warning">
      {{ sourcifyWarning }}
    </div>
    <div class="success">
      {{ sourcifySuccess }}
    </div>
    <div class="remember-me">
      <Checkbox
        @onChange="handleRememberMeSourcify"
        :checked="rememberSourcify"
        label="Remember URL"
      />
    </div>
  </div>
</template>

<style scoped>
.sourcify-icon {
  width: 20px;
  height: 20px;
}

.soucify-field {
  display: flex;
  align-items: normal;
  gap: 7px;
}

.description {
  word-wrap: break-word;
}

.sourcify-header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.warning,
.success {
  font-size: 17px;
}

.remember-me {
  margin-top: 7px;
}

.check-sourcify-btn {
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
