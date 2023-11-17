const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initialize();

const convertPlayerDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScoreDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const api1 = `
    select
    * 
    from 
        player_details;`;
  const playersArray = await db.all(api1);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const api2 = `
    select
    *
    from
        player_details
    where 
        player_id=${playerId};`;
  const player = await db.get(api2);
  response.send(convertPlayerDetailsDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const api3 = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};`;
  await db.run(api3);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const api4 = `
    select
    match_id as matchId,
    match,
    year
    from
        match_details
    where 
            match_id = ${matchId};`;
  const matchDetails = await db.get(api4);
  response.send(matchDetails);
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const api5 = `
    select 
        match_id as matchId,
        match,
        year
    from
        player_match_score natural join match_details
    where 
        player_id = ${playerId};`;
  const playerMatchArray = await db.all(api5);
  response.send(playerMatchArray);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const api6 = `
    select 
        player_match_score.player_id as playerId,
        player_name as playerName
    from 
        player_details inner join player_match_score
        on player_details.player_id = player_match_score.player_id
    where
        match_id =${matchId};`;
  const matchPlayers = await db.all(api6);
  response.send(matchPlayers);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const api7 = `
    select 
        player_details.player_id as playerId,
        player_details.player_name as playerName,
        SUM(player_match_score.score) as totalScore,
        SUM(fours) as totalFours,
        SUM(sixes) as totalSixes
    from 
        player_details inner join player_match_score 
        on player_details.player_id =player_match_score.player_id
    where 
        player_details.player_id =${playerId};`;
  const playerScores = await db.get(api7);
  response.send(playerScores);
});
module.exports = app;
