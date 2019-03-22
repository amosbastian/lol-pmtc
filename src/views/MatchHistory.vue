<template>
  <div class="home">
    <match-history-input v-on:urlSubmitted="getThread($event)" />
    <div class="container mx-auto min-h-full">
      <div class="flex justify-center align-center text-white" v-if="loading">
        Loading...
      </div>
      <div class="flex justify-center align-center">
        <textarea class="w-1/2 h-64" v-if="thread" v-model="thread"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import { createThread } from '@/utils/matchHistory.js';
import MatchHistoryInput from '@/components/MatchHistoryInput.vue';

export default {
  name: 'home',
  data() {
    return {
      champions: [],
      playerIdentities: [],
      thread: '',
      loading: false
    };
  },
  components: {
    MatchHistoryInput
  },
  methods: {
    async getThread(url) {
      this.loading = true;
      const baseUrl = 'https://acs.leagueoflegends.com/v1/stats/game/';
      const pattern = /\/([A-Z\d]+)\/(\d+)\?gameHash=([a-z\d]+)/;
      const matchingGroups = pattern.exec(url);

      if (!matchingGroups) {
        // TODO: handle error properly
        alert('ERROR! ERROR! ERROR!');
        return;
      }

      const [, platformId, gameId, gameHash] = matchingGroups;
      const gameUrl = `${baseUrl}${platformId}/${gameId}?gameHash=${gameHash}`;
      const timelineUrl = `${baseUrl}${platformId}/${gameId}/timeline?gameHash=${gameHash}`;

      const thread = await createThread(url, gameUrl, timelineUrl);
      this.loading = false;
      this.thread = thread;
    }
  }
};
</script>

<style>
textarea {
  resize: none !important;
  overflow: hidden !important;
}
</style>
