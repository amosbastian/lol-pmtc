<template>
  <div class="home">
    <match-history-input v-on:urlSubmitted="createThread($event)"/>
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
      playerIdentities: []
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
    convertEventType(event) {
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
    formatEvents(events) {
      let eventString = '';
      events.forEach(event => {
        const eventName = this.convertEventType(event);
        eventString += `${eventName}^${event.order} `;
      });

      return eventString;
    },
    async getEvents(teamOne, teamTwo, timelineUrl) {
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
        this.formatEvents(teamOneEvents),
        this.formatEvents(teamTwoEvents)
      ];
    },
    async handleGameData(gameUrl, timelineUrl) {
      const response = await axios.get(
        `${'https://cors-anywhere.herokuapp.com/'}${gameUrl}`
      );
      const gameData = response.data;
      const { participantIdentities, teams, participants } = gameData;

      this.playerIdentities = participantIdentities;

      const [teamOne, teamTwo] = teams;
      teamOne.name = participantIdentities[0].player.summonerName.split(' ')[0];
      teamTwo.name = participantIdentities[5].player.summonerName.split(' ')[0];

      const gameEvents = this.getEvents(teamOne, teamTwo, timelineUrl);
      // const scoreboard = this.getScoreboard(
      //   teamOne.name,
      //   teamTwo.name,
      //   participants
      // );
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

      this.handleGameData(gameUrl, timelineUrl);
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
