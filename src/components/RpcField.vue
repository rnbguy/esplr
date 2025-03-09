<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Checkbox from '@/components/Checkbox.vue';

const emit = defineEmits(['connect']);
defineProps<{ connectionError: boolean }>();

const RPC_URL = '';
const rpcUrl = ref(RPC_URL);
const remember = ref(false);

onMounted(() => {
  // auto connect for development
  // emit('connect', RPC_URL)

  remember.value = isUrlInLocalStorage();
  if (remember.value) {
    rpcUrl.value = localStorage.getItem('rpcUrl') as string;
  }
});

const handleConnect = async () => {
  if (!rpcUrl.value) {
    return;
  }
  const hasProtocol = hasValidProtocol(rpcUrl.value);
  const url = hasProtocol ? rpcUrl.value : addProtocol(rpcUrl.value);
  emit('connect', url);
};

function addProtocol(url: string) {
  if (url.startsWith('127.0.0.1') || url.startsWith('localhost')) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

function hasValidProtocol(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false; // Invalid URL
  }
}

const handleRpcUrlInput = () => {
  if (remember.value) {
    localStorage.setItem('rpcUrl', rpcUrl.value);
  }
  if (!rpcUrl.value.length) {
    localStorage.clear();
  }
};

const isUrlInLocalStorage = () => !!localStorage.getItem('rpcUrl')?.length;

const handleRememberMe = () => {
  if (remember.value) {
    localStorage.clear();
  } else if (rpcUrl.value.length) {
    localStorage.setItem('rpcUrl', rpcUrl.value);
  }
  remember.value = !remember.value;
};
</script>

<template>
  <div class="rpc-field">
    <div class="input-wrapper">
      <input
        class="text-input"
        type="text"
        v-model.trim="rpcUrl"
        @input="handleRpcUrlInput"
        placeholder="ex. https://fullnode.com/api-key"
      />
      <button class="btn" @click="handleConnect">Connect</button>
    </div>
    <div class="remember-me">
      <Checkbox @onChange="handleRememberMe" :checked="remember" label="Remember URL" />
    </div>
    <div v-if="connectionError" class="error">
      Connection error. Please check your RPC URL or internet connection and try again.
    </div>
  </div>
</template>

<style scoped>
.rpc-field {
  margin-bottom: 40px;
}

.input-wrapper {
  display: flex;
  gap: 7px;
  flex-direction: column;
}

@media (min-width: 485px) {
  .input-wrapper {
    flex-direction: row;
  }
}

.error {
  color: var(--error);
  font-size: 16px;
  margin-top: 5px;
}

.remember-me {
  margin-top: 7px;
}
</style>
