const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "twitterClone.db");
app.use(express.json());
let db = null;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authenticateToken = (request, response, next) => {
  let token;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    token = authHeader.split(" ")[1];
  }
  if (token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(token, "bsdjsjbfljks", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

//API 1

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const getQuery = `
  SELECT 
  *
  FROM
  user
  WHERE username = "${username}";
  `;
  const getQueryResult = await db.get(getQuery);

  if (getQueryResult === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const addNewUserQuery = `
        INSERT INTO 
        user (name, username, password, gender)
        VALUES ("${name}", "${username}", "${hashedPassword}", "${gender}");
        `;
      const addNewUserResult = await db.run(addNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getQuery = `
  SELECT 
  *
  FROM
  user
  WHERE username = "${username}";
  `;
  const getQueryResult = await db.get(getQuery);

  if (getQueryResult === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      getQueryResult.password
    );
    if (isPasswordMatched === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "bsdjsjbfljks");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getTweetRequest = `
  SELECT
    username, tweet, date_time AS dateTime
    FROM
    (user INNER JOIN (
        SELECT
        following_user_id
        FROM
        user INNER JOIN follower ON user.user_id = follower.follower_user_id
        WHERE 
        user.username = "${username}"
    ) AS P ON user.user_id = P.following_user_id
    ) INNER JOIN tweet ON P.following_user_id = tweet.user_id
    ORDER BY tweet.date_time DESC
    LIMIT 4;
  `;
  const getTweetResult = await db.all(getTweetRequest);
  response.send(getTweetResult);
});

//API 4

app.get("/user/following/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getFollowingQuery = `
    SELECT
    name
    FROM
    user INNER JOIN (
        SELECT
        following_user_id
        FROM
        user INNER JOIN follower ON user.user_id = follower.follower_user_id
        WHERE 
        user.username = "${username}"
    ) ON user_id = following_user_id;    
    `;
  const getFollowingResult = await db.all(getFollowingQuery);
  response.send(getFollowingResult);
});

//API 5

app.get("/user/followers/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getFollowerQuery = `
    SELECT
    name
    FROM
    user INNER JOIN (
        SELECT
        follower_user_id
        FROM
        user INNER JOIN follower ON user.user_id = follower.following_user_id
        WHERE 
        user.username = "${username}"
    ) ON user_id = follower_user_id;
    `;
  const getFollowerResult = await db.all(getFollowerQuery);
  response.send(getFollowerResult);
});

//API 6

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  const { username } = request;
  const { tweetId } = request.params;
  const getTweetQuery = `
  SELECT
  tweet, (
      SELECT COUNT(*)
      FROM like
      WHERE 
  )
  FROM 
  user INNER JOIN 
  `;
});

module.exports = app;
