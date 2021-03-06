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
app.get('/movies', getMovies);

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

function getMovies(req, res) {
  return searchMovies(req.query.data)
    .then(moviesData => {
      res.send(moviesData);
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

function Movie(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  if (movie.poster_path) {
    this.image_url = `http://image.tmdb.org/t/p/w200_and_h300_bestv2${movie.poster_path}`;
  } else {
    this.image_url = null;
  }
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
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

function searchMovies(query) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${query.search_query}`;
  return superagent.get(url)
    .then(moviesData => {
      console.log(moviesData.body);
      return moviesData.body.results.map(movie => new Movie(movie));
    })
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
