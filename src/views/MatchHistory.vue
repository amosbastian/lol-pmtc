<template>
  <div class="home">
    <match-history-input
      msg="Welcome to Your Vue.js App"
      v-on:urlSubmitted="createThread($event)"
    />
  </div>
</template>

<script>
import MatchHistoryInput from '@/components/MatchHistoryInput.vue';

export default {
  name: 'home',
  components: {
    MatchHistoryInput
  },
  methods: {
    createThread(url) {
      console.log(url);
    }
  }
};
</script>
