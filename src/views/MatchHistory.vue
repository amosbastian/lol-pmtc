<template>
  <div class="h-screen flex flex-col">
    <match-history-input v-on:urlSubmitted="getThread($event)" />
    <div class="flex flex-1 flex-col justify-center items-center">
      <div class="text-white" v-if="loading">
        <self-building-square-spinner
          :animation-duration="6000"
          :size="40"
          color="#ffffff"
        />
      </div>
      <div
        class="w-2/3 flex flex-col justify-center items-center"
        v-show="thread"
      >
        <div class="w-2/3 flex flex-grow justify-end">
          <button
            v-clipboard:copy="thread"
            v-clipboard:success="onCopy"
            v-clipboard:error="onError"
            class="py-2 px-4 bg-purple-dark text-white hover:bg-purple focus:outline-none focus:border-purple"
          >
            Copy
          </button>
        </div>
        <textarea class="w-2/3 h-64" v-model="thread"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import { createThread } from '@/utils/matchHistory.js';
import { SelfBuildingSquareSpinner } from 'epic-spinners';
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
    MatchHistoryInput,
    SelfBuildingSquareSpinner
  },
  methods: {
    async getThread(url) {
      const baseUrl = 'https://acs.leagueoflegends.com/v1/stats/game/';
      const pattern = /\/([A-Z\d]+)\/(\d+)\?gameHash=([a-z\d]+)/;
      const matchingGroups = pattern.exec(url);

      if (!matchingGroups) {
        this.$toasted.error('Something went wrong!').goAway(1500);
        return;
      }

      this.loading = true;
      this.thread = '';

      const [, platformId, gameId, gameHash] = matchingGroups;
      const gameUrl = `${baseUrl}${platformId}/${gameId}?gameHash=${gameHash}`;
      const timelineUrl = `${baseUrl}${platformId}/${gameId}/timeline?gameHash=${gameHash}`;

      const thread = await createThread(url, gameUrl, timelineUrl);
      this.loading = false;
      this.thread = thread;
    },
    onCopy() {
      this.$toasted.success('Copied!').goAway(1500);
    },
    onError() {
      this.$toasted.error('Something went wrong!').goAway(1500);
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
