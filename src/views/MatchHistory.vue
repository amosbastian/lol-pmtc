<template>
  <div class="home">
    <match-history-input
      msg="Welcome to Your Vue.js App"
      v-on:urlSubmitted="createThread($event)"
    />
  </div>
</template>

<script>
import axios from 'axios';
import MatchHistoryInput from '@/components/MatchHistoryInput.vue';

export default {
  name: 'home',
  data() {
    return {
      champions: []
    };
  },
  components: {
    MatchHistoryInput
  },
  methods: {
    getFormattedBans(team) {
      let banString = '';
      team.bans.forEach(ban => {
        const champion = this.champions.find(
          champion => parseInt(champion.key) === ban.championId
        );
        const championName = champion.name.toLowerCase();
        const championDivider =
          ban.pickTurn === 5 || ban.pickTurn === 6 ? '|' : ' ';
        banString += `[${championName}](#c-${championName})${championDivider}`;
      });

      console.log(banString);
    },
    async handleGameData(gameUrl) {
      const response = await axios.get(
        `${'https://cors-anywhere.herokuapp.com/'}${gameUrl}`
      );
      const gameData = response.data;
      const { participantIdentities, teams, participants } = gameData;
      const [teamOne, teamTwo] = teams;
      teamOne.name = participantIdentities[0].player.summonerName.split(' ')[0];
      teamTwo.name = participantIdentities[5].player.summonerName.split(' ')[0];
      this.getFormattedBans(teamOne);
    },
    async createThread(url) {
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
      console.log(gameUrl);
      console.log(timelineUrl);

      this.handleGameData(gameUrl);
    }
  },
  async created() {
    const versions = await axios.get(
      'http://ddragon.leagueoflegends.com/api/versions.json'
    );
    const currentPatch = versions.data[0];
    const response = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/en_US/champion.json`
    );
    this.champions = Object.keys(response.data.data).map(
      key => response.data.data[key]
    );
  }
};
</script>
