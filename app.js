require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");

var routerV1 = require("./routes/v1/index");

const { database } = require("./config/database");

// NEED CRON TO MAKE SCHEDULE AUTOMATICALY DAILY FETCH
const {
  cronGeneratorSchedule,
  // cronGeneratorDaily,
} = require("./functions/cronGeneratorSchedule");
const cronCheckDelayStatus = require("./functions/cronCheckDelayStatus");

async function init_start() {
  console.log("Running cronGeneratorSchedule()....");
  await cronGeneratorSchedule();
  console.log("Finished cronGeneratorSchedule()....");
  console.log("Running cronGeneratorDaily()....");
  // await cronGeneratorDaily();
  console.log("Finished cronGeneratorDaily()....");
  console.log("Running cronCheckDelayStatus()....");
  await cronCheckDelayStatus();
  console.log("Finished cronCheckDelayStatus()....");
}

database.connect();
console.log("DB Connecttion:");
console.log({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  ssl: false,
});
console.log(`SERVER PORT: ${process.env.PORT}`);

var app = express();
app.use(cors());
init_start();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routerV1);

module.exports = app;
