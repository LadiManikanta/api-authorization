const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(1010, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(`error is ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const userQueryDetails = `
      SELECT *
      FROM user
      WHERE username = '${username}';
    `;
  const personDetails = await db.get(userQueryDetails);
  if (personDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(
      password,
      personDetails.password
    );
    if (checkPassword === true) {
      const payload = { username: username };
      const token = jwt.sign(payload, "SECRET");
      response.send({ token });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const middleWareCheck = (request, response, next) => {
  let jwtToken = null;
  const headerSection = request.headers["Authorization"];
  if (headerSection !== undefined) {
    jwtToken = headerSection.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    console.log("1");
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "SECRET", async (error, payload) => {
      if (error) {
        response.status(401);
        console.log("2");
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.get("/states/", middleWareCheck, async (request, response) => {
  const queryDetails = `
      SELECT *
      FROM state;

    `;
  const stateNamesData = await db.all(queryDetails);
  console.log(stateNamesData);
  response.send(stateNamesData);
});
app.get("/states/:stateId/", middleWareCheck, async (request, response) => {
  const { state_Id } = request.params;
  const queryDetails = `
      SELECT *
      FROM state
      WHERE state_id = ${state_Id} ;

    `;
  const stateNamesData = await db.get(queryDetails);
  response.send(stateNamesData);
});
