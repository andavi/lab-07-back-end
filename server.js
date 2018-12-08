'use strict'

// Application Dependencies
const express = require('express')
const cors = require('cors')
const superagent = require('superagent')

// Load env vars;
require('dotenv').config()

const PORT = process.env.PORT || 3000

// App
const app = express()

app.use(cors())

// Error handling
function handleError (res) {
  res.status(500).send('Sorry something went wrong!')
}

// Routes
app.get('/location', getLocation)
app.get('/weather', getWeather)

// Handlers
function getLocation (req, res) {
  return searchToLatLong(req.query.data || 'lynwood')
    .then(locationData => {
      res.send(locationData);
    });
}

function getWeather (req, res) {
  // const weatherData = searchForWeather(req.query.data)
  // res.send(req.query.data)
  return searchForWeather(req.query.data)
    .then(weatherData => {
      res.send(weatherData);
    });
}

// Constructors
function Location (location, query) {
  this.search_query = query
  this.formatted_query = location.formatted_address
  this.latitude = location.geometry.location.lat
  this.longitude = location.geometry.location.lng
}
function Daily (day) {
  this.forecast = day.summary
  this.time = new Date(day.time * 1000).toDateString()
}

// Search Functions
function searchToLatLong (query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(geoData => {
      const location = new Location(geoData.body.results[0], query);
      return location;
    })
    .catch(err => console.error(err));
}
function searchForWeather (query) {
  // const weatherJson = require('./data/darksky.json')
  // return weatherJson.daily.data.map(day => new Daily(day));
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${query.latitude},${query.latitude}`;
  return superagent.get(url)
    .then(weatherData => {
      console.log(weatherData.body.daily);
      return weatherData.body.daily.data.map(day => new Daily(day));
    })
    .catch(err => console.error(err));
}

// Bad path
// app.get('/*', function(req, res) {
//   res.status(404).send('You are in the wrong place');
// });

// Listen
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`)
 }
)
