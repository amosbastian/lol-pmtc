<template>
  <div class="home">
    <match-history-input msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import MatchHistoryInput from '@/components/MatchHistoryInput.vue';

export default {
  name: 'home',
  components: {
    MatchHistoryInput
  }
};
</script>
