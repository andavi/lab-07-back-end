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
app.get('/yelp', getYelp);

// Handlers
function getLocation (req, res) {
  return searchToLatLong(req.query.data || 'lynwood')
    .then(locationData => {
      res.send(locationData);
    });
}

function getWeather (req, res) {
  return searchForWeather(req.query.data)
    .then(weatherData => {
      res.send(weatherData);
    });
}

function getYelp(req, res) {
  return searchYelp(req.query.data)
    .then(yelpData => {
      res.send(yelpData);
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

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
}

// Search Functions
function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(geoData => {
      const location = new Location(geoData.body.results[0], query);
      return location;
    })
    .catch(err => console.error(err));
}

function searchForWeather(query) {
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${query.latitude},${query.longitude}`;
  return superagent.get(url)
    .then(weatherData => {
      return weatherData.body.daily.data.map(day => new Daily(day));
    })
    .catch(err => console.error(err));
}

function searchYelp(query) {
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${query.latitude}&longitude=${query.longitude}`;
  return superagent.get(url)  
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(yelpData => {
      return yelpData.body.businesses.map(business => new Yelp(business));
    });
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
