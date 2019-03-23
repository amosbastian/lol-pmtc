import axios from 'axios';

let playerIdentities = [];
let champions = [];

function indexToRole(index) {
  const roles = {
    0: 'TOP',
    1: 'JNG',
    2: 'MID',
    3: 'BOT',
    4: 'SUP'
  };
  return roles[index];
}

function getTeamKDA(team) {
  // Count all kills, deaths and assists of the team's players
  const totalKills = team.reduce((a, b) => a + (b.stats.kills || 0), 0);
  const totalDeaths = team.reduce((a, b) => a + (b.stats.deaths || 0), 0);
  const totalAssists = team.reduce((a, b) => a + (b.stats.assists || 0), 0);
  return `${totalKills}-${totalDeaths}-${totalAssists}`;
}

function getTeamGold(team) {
  const totalGold = team.reduce((a, b) => a + (b.stats.goldEarned || 0), 0);
  return `${(totalGold / 1000).toFixed(1)}k`;
}

function getPlayerKDA(player) {
  return `${player.stats.kills}-${player.stats.deaths}-${player.stats.assists}`;
}

function getPlayerName(playerId) {
  // Find player identity and split name by team, e.g. FNC Bwipo -> Bwipo
  return playerIdentities
    .find(player => player.participantId === playerId)
    .player.summonerName.split(' ')
    .slice(1)
    .join(' ');
}

function getFormattedChampion(champion) {
  // For Reddit champion icons
  const championName = champion.replace(' ', '');
  return `[${championName}](#c-${championName})`;
}

function getChampionName(championId) {
  return getFormattedChampion(
    champions
      .find(champion => parseInt(champion.key) === championId)
      .name.toLowerCase()
  );
}

function getFormattedBans(team) {
  let banString = '';
  team.bans.forEach(ban => {
    const champion = getFormattedChampion(
      champions
        .find(champion => parseInt(champion.key) === ban.championId)
        .name.toLowerCase()
    );

    // Add divider if current ban is the last ban of either team's first round
    const championDivider =
      ban.pickTurn === 5 || ban.pickTurn === 6 ? '|' : ' ';
    banString += `${champion}${championDivider}`;
  });

  return banString;
}

function getScoreboard(teamOneName, teamTwoName, players) {
  const teamOnePlayers = players.slice(0, 5);
  const teamTwoPlayers = players.slice(5);

  const teamOneKDA = getTeamKDA(teamOnePlayers);
  const teamTwoKDA = getTeamKDA(teamTwoPlayers);

  const tableHeader = `|**${teamOneName}**|${teamOneKDA}|[vs](#mt-kills)|${teamTwoKDA}|**${teamTwoName}**|`;
  let tableBody = '\n|--:|--:|:--:|:--|:--|\n';

  // Iterate over both team's players in pairs: TOP -> JNG etc.
  teamOnePlayers.map((playerOne, index) => {
    const playerTwo = teamTwoPlayers[index];
    const role = indexToRole(index);

    const championOne = getChampionName(playerOne.championId);
    const championTwo = getChampionName(playerTwo.championId);

    const playerOneName = getPlayerName(playerOne.participantId);
    const playerTwoName = getPlayerName(playerTwo.participantId);

    const playerOneKDA = getPlayerKDA(playerOne);
    const playerTwoKDA = getPlayerKDA(playerTwo);

    tableBody += `|${playerOneName} ${championOne}|${playerOneKDA}|${role}|${playerTwoKDA}|${championTwo} ${playerTwoName}|\n`;
  });

  const formattedTable = tableHeader + tableBody;

  return formattedTable;
}

function getMonsterName(event) {
  // Epic monster icons for Reddit
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
}

function formatMonsters(events) {
  let monsterString = '';

  events.forEach(event => {
    const monsterName = getMonsterName(event);
    monsterString += `${monsterName}^${event.order} `;
  });

  return monsterString;
}

async function getEpicMonsters(timelineUrl) {
  const response = await axios.get(
    `${'https://cors-anywhere.herokuapp.com/'}${timelineUrl}`
  );

  // Flatten the object so it can be filtered easily
  const allEvents = response.data.frames.map(frame => frame.events).flat();
  const importantEvents = allEvents.filter(
    event => event.type === 'ELITE_MONSTER_KILL'
  );
  // Set the order the monsters were taken in
  importantEvents.forEach((event, index) => (event.order = index + 1));

  const teamOneEvents = importantEvents.filter(event => event.killerId < 6);
  const teamTwoEvents = importantEvents.filter(event => event.killerId > 5);

  return [formatMonsters(teamOneEvents), formatMonsters(teamTwoEvents)];
}

async function getObjectives(teamOne, teamTwo, players, timelineUrl) {
  const [teamOneMonsters, teamTwoMonsters] = await getEpicMonsters(timelineUrl);
  const teamOneBans = getFormattedBans(teamOne);
  const teamTwoBans = getFormattedBans(teamTwo);
  const teamOneGold = getTeamGold(players.slice(0, 5));
  const teamTwoGold = getTeamGold(players.slice(5));

  let table =
    '||Bans 1|Bans 2|[G](#mt-gold)|[T](#mt-towers)|D/B|\n|:--|:--:|:--:|:--:|:--:|:--:|\n';
  table += `|**${teamOne.name}**|${teamOneBans}|${teamOneGold}|${
    teamOne.towerKills
  }|${teamOneMonsters}|\n`;
  table += `|**${teamTwo.name}**|${teamTwoBans}|${teamTwoGold}|${
    teamTwo.towerKills
  }|${teamTwoMonsters}|`;

  return table;
}

function getThreadHeader(teamOne, teamTwo, gameDuration, url) {
  const winner = teamOne.win === 'Win' ? teamOne : teamTwo;
  const minutes = gameDuration / 60;

  let header = '';
  header += `### MATCH: [${teamOne.name} vs. ${teamTwo.name}](${url})\n`;
  header += `**Winner: ${winner.name}** in ${Math.round(minutes)}m  \n`;

  return header;
}

async function loadChampions() {
  const versions = await axios.get(
    'http://ddragon.leagueoflegends.com/api/versions.json'
  );
  const currentPatch = versions.data[0];
  const response = await axios.get(
    `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/en_US/champion.json`
  );
  champions = Object.keys(response.data.data).map(
    key => response.data.data[key]
  );
}

async function createThread(matchHistoryUrl, gameUrl, timelineUrl) {
  await loadChampions();
  const response = await axios.get(
    `${'https://cors-anywhere.herokuapp.com/'}${gameUrl}`
  );
  const gameData = response.data;
  const { participantIdentities, teams, participants } = gameData;

  playerIdentities = participantIdentities;

  const [teamOne, teamTwo] = teams;

  // Get each team's acronym from a player's name, e.g. Fnatic -> FNC
  teamOne.name = participantIdentities[0].player.summonerName.split(' ')[0];
  teamTwo.name = participantIdentities[5].player.summonerName.split(' ')[0];

  const threadHeader = getThreadHeader(
    teamOne,
    teamTwo,
    gameData.gameDuration,
    matchHistoryUrl
  );

  const objectives = await getObjectives(
    teamOne,
    teamTwo,
    participants,
    timelineUrl
  );

  const scoreboard = getScoreboard(teamOne.name, teamTwo.name, participants);

  return `${threadHeader}\n\n${objectives}\n\n${scoreboard}`;
}

export { createThread };
