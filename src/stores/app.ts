import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const networkName = ref('');
  const rpcUrl = ref('');

  function setNetworkName(name: string) {
    networkName.value = name;
  }

  function setRpcUrl(url: string) {
    rpcUrl.value = url;
  }

  return { setNetworkName, networkName, setRpcUrl, rpcUrl };
});
