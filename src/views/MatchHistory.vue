<template>
  <div class="home">
    <match-history-input v-on:urlSubmitted="createThread($event)" />
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
import axios from 'axios';
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
    indexToRole(index) {
      const roles = {
        0: 'TOP',
        1: 'JNG',
        2: 'MID',
        3: 'BOT',
        4: 'SUP'
      };
      return roles[index];
    },
    getTeamKDA(team) {
      const totalKills = team.reduce((a, b) => a + (b.stats.kills || 0), 0);
      const totalDeaths = team.reduce((a, b) => a + (b.stats.deaths || 0), 0);
      const totalAssists = team.reduce((a, b) => a + (b.stats.assists || 0), 0);
      return `${totalKills}-${totalDeaths}-${totalAssists}`;
    },
    getTeamGold(team) {
      const totalGold = team.reduce((a, b) => a + (b.stats.goldEarned || 0), 0);
      return `${(totalGold / 1000).toFixed(1)}k`;
    },
    getPlayerKDA(player) {
      return `${player.stats.kills}-${player.stats.deaths}-${
        player.stats.assists
      }`;
    },
    getPlayerName(playerId) {
      return this.playerIdentities
        .find(player => player.participantId === playerId)
        .player.summonerName.split(' ')
        .slice(1)
        .join(' ');
    },
    getFormattedChampion(champion) {
      const championName = champion.replace(' ', '');
      return `[${championName}](#c-${championName})`;
    },
    getChampionName(championId) {
      return this.getFormattedChampion(
        this.champions
          .find(champion => parseInt(champion.key) === championId)
          .name.toLowerCase()
      );
    },
    getFormattedBans(team) {
      let banString = '';
      team.bans.forEach(ban => {
        const champion = this.getFormattedChampion(
          this.champions
            .find(champion => parseInt(champion.key) === ban.championId)
            .name.toLowerCase()
        );
        const championDivider =
          ban.pickTurn === 5 || ban.pickTurn === 6 ? '|' : ' ';
        banString += `${champion}${championDivider}`;
      });

      return banString;
    },
    getScoreboard(teamOneName, teamTwoName, players) {
      const teamOnePlayers = players.slice(0, 5);
      const teamTwoPlayers = players.slice(5);
      const teamOneKDA = this.getTeamKDA(teamOnePlayers);
      const teamTwoKDA = this.getTeamKDA(teamTwoPlayers);

      const tableHeader = `|**${teamOneName}**|${teamOneKDA}|[vs](#mt-kills)|${teamTwoKDA}|**${teamTwoName}**|`;
      let tableBody = '\n|--:|--:|:--:|:--|:--|\n';

      teamOnePlayers.map((playerOne, index) => {
        const playerTwo = teamTwoPlayers[index];
        const role = this.indexToRole(index);

        const championOne = this.getChampionName(playerOne.championId);
        const championTwo = this.getChampionName(playerTwo.championId);

        const playerOneName = this.getPlayerName(playerOne.participantId);
        const playerTwoName = this.getPlayerName(playerTwo.participantId);

        const playerOneKDA = this.getPlayerKDA(playerOne);
        const playerTwoKDA = this.getPlayerKDA(playerTwo);

        tableBody += `|${playerOneName} ${championOne}|${playerOneKDA}|${role}|${playerTwoKDA}|${championTwo} ${playerTwoName}|\n`;
      });
      const formattedTable = tableHeader + tableBody;
      return formattedTable;
    },
    getMonsterName(event) {
      const eventTypes = {
        AIR_DRAGON: '[C](#mt-cloud)',
        WATER_DRAGON: '[M](#mt-ocean)',
        FIRE_DRAGON: '[I](#mt-infernal)',
        EARTH_DRAGON: '[M](#mt-mountain)',
        BARON_NASHOR: '[B](#mt-barons)',
        RIFTHERALD: '[H](#mt-herald)'
      };
      if (event.monsterType === 'DRAGON') {
        return eventTypes[event.monsterSubType];
      }
      return eventTypes[event.monsterType];
    },
    formatMonsters(events) {
      let monsterString = '';
      events.forEach(event => {
        const monsterName = this.getMonsterName(event);
        monsterString += `${monsterName}^${event.order} `;
      });

      return monsterString;
    },
    async getEpicMonsters(timelineUrl) {
      const response = await axios.get(
        `${'https://cors-anywhere.herokuapp.com/'}${timelineUrl}`
      );
      const allEvents = response.data.frames.map(frame => frame.events).flat();
      const importantEvents = allEvents.filter(
        event => event.type === 'ELITE_MONSTER_KILL'
      );
      importantEvents.forEach((event, index) => (event.order = index + 1));
      const teamOneEvents = importantEvents.filter(event => event.killerId < 6);
      const teamTwoEvents = importantEvents.filter(event => event.killerId > 5);

      return [
        this.formatMonsters(teamOneEvents),
        this.formatMonsters(teamTwoEvents)
      ];
    },
    async getObjectives(teamOne, teamTwo, players, timelineUrl) {
      const [teamOneMonsters, teamTwoMonsters] = await this.getEpicMonsters(
        timelineUrl
      );
      const teamOneBans = this.getFormattedBans(teamOne);
      const teamTwoBans = this.getFormattedBans(teamTwo);
      const teamOneGold = this.getTeamGold(players.slice(0, 5));
      const teamTwoGold = this.getTeamGold(players.slice(5));

      let table =
        '||Bans 1|Bans 2|[G](#mt-gold)|[T](#mt-towers)|D/B|\n|:--|:--:|:--:|:--:|:--:|:--:|\n';
      table += `|**${teamOne.name}**|${teamOneBans}|${teamOneGold}|${
        teamOne.towerKills
      }|${teamOneMonsters}|\n`;
      table += `|**${teamTwo.name}**|${teamTwoBans}|${teamTwoGold}|${
        teamTwo.towerKills
      }|${teamTwoMonsters}|`;

      return table;
    },
    getThreadHeader(teamOne, teamTwo, gameDuration, url) {
      const winner = teamOne.win === 'Win' ? teamOne : teamTwo;
      const minutes = gameDuration / 60;

      let header = '';
      header += `### MATCH: [${teamOne.name} vs. ${teamTwo.name}](${url})\n`;
      header += `**Winner: ${winner.name}** in ${Math.round(minutes)}m  \n`;

      return header;
    },
    async handleGameData(matchHistoryUrl, gameUrl, timelineUrl) {
      const response = await axios.get(
        `${'https://cors-anywhere.herokuapp.com/'}${gameUrl}`
      );
      const gameData = response.data;
      const { participantIdentities, teams, participants } = gameData;

      this.playerIdentities = participantIdentities;

      const [teamOne, teamTwo] = teams;
      teamOne.name = participantIdentities[0].player.summonerName.split(' ')[0];
      teamTwo.name = participantIdentities[5].player.summonerName.split(' ')[0];

      const threadHeader = this.getThreadHeader(
        teamOne,
        teamTwo,
        gameData.gameDuration,
        matchHistoryUrl
      );

      const objectives = await this.getObjectives(
        teamOne,
        teamTwo,
        participants,
        timelineUrl
      );

      const scoreboard = this.getScoreboard(
        teamOne.name,
        teamTwo.name,
        participants
      );

      return `${threadHeader}\n\n${objectives}\n\n${scoreboard}`;
    },
    async createThread(url) {
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

      const thread = await this.handleGameData(url, gameUrl, timelineUrl);
      this.loading = false;
      this.thread = thread;
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

<style>
textarea {
  resize: none !important;
  overflow: hidden !important;
}
</style>
