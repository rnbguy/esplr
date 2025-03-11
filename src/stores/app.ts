import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const networkName = ref('');
  const rpcUrl = ref('');
  const isErigon = ref(false);

  function setNetworkName(name: string) {
    networkName.value = name;
  }

  function setRpcUrl(url: string) {
    rpcUrl.value = url;
  }

  function setIsErigon(value: boolean) {
    isErigon.value = value;
  }

  return { setNetworkName, networkName, setRpcUrl, rpcUrl, setIsErigon, isErigon };
});
