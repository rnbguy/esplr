<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const search = ref('');
let usedUnput = false;
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const TX_RE = /^0x[0-9a-fA-F]{64}$/;
const BLOCK_RE = /^[1-9][0-9]*$/;

watch(
  () => [route.params.block, route.params.tx, route.params.address],
  ([block, tx, address]) => {
    if (!usedUnput) {
      search.value = '';
      usedUnput = false;
      return;
    }
    if (!block?.length && !tx?.length && !address?.length) return;
    search.value = (block as string) || (tx as string) || (address as string);
    usedUnput = false;
  }
);

const handleInput = () => {
  const query = search.value;
  usedUnput = true;
  if (ADDR_RE.test(query)) return router.push({ path: `/address/${query}` });
  if (TX_RE.test(query)) return router.push({ path: `/tx/${query}` });
  if (BLOCK_RE.test(query)) return router.push({ path: `/block/${query}` });
  usedUnput = false;
};
</script>

<template>
  <div class="search">
    <input
      class="text-input"
      type="text"
      v-model.trim="search"
      placeholder="Search addresses, transactions, blocks"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
.search {
  text-align: right;
  position: relative;
  display: flex;
  gap: 7px;
  margin-top: 10px;
  margin-bottom: 10px;
}
input {
  width: 100%;
}
</style>
