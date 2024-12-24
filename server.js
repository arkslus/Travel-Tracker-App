// Require postgres
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "Alhamdulilah@7813",
  host: "localhost",
  port: 5432, // default Postgres port
  database: "world",
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};

pool.connect();

// Require express app
const express = require("express");
const app = express();

// Require path
const path = require("path");
// set path to views
app.set("views", path.join(__dirname, "views"));
// Set the view engine for the ejs file
app.set("view engine", "ejs");

// Middleware
// for post request, we will need url encoded
app.use(express.urlencoded({ extended: true }));
// This is to use the public file
app.use(express.static("public"));

// function to check the visited countries
async function checkVisited() {
  const result = await pool.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

// Get the homepage
app.get("/", async (req, res) => {
  //Write your code here.
  const countries = await checkVisited();
  res.render("index.ejs", { countries, total: countries.length });
});

//INSERT new country
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await pool.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await pool.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on 3000!");
});
