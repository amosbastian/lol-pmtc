<template>
  <div class="home">
    <match-history-input msg="Welcome to Your Vue.js App" v-on:urlSubmitted="createThread($event)"/>
  </div>
</template>

<script>
import axios from 'axios';
import MatchHistoryInput from '@/components/MatchHistoryInput.vue';

export default {
  name: 'home',
  components: {
    MatchHistoryInput
  },
  methods: {
    async createThread(url) {
      const baseUrl = 'https://acs.leagueoflegends.com/v1/stats/game/';
      const pattern = /\/([A-Z\d]+)\/(\d+)\?gameHash=([a-z\d]+)/;
      const matchingGroups = pattern.exec(url);

      const platformId = matchingGroups[1];
      const gameId = matchingGroups[2];
      const gameHash = matchingGroups[3];
      console.log(platformId, gameId, gameHash);

      const gameUrl = `${baseUrl}${platformId}/${gameId}?gameHash=${gameHash}`;
      const timelineUrl = `${baseUrl}${platformId}/${gameId}/timeline?gameHash=${gameHash}`;
      console.log(gameUrl);
      console.log(timelineUrl);
    }
  }
};
</script>
