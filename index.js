var admin = require("firebase-admin");
var serviceAccount = require("./newsnowtest-firebase-adminsdk-r2185-e476e5c430.json");

/* 
------------------------------
FOR TESTING ONLY with express --> REMOVE LATER?
------------------------------
*/
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  var article = getArticlesGreaterThanPopularity(1).then(function(obj) {
    res.send(obj);
  }).catch(function(error) {
    res.send(error.toString());
  });
  // var article = getArticlesGreaterThanPopularity(1);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
/* 
------------------------------
Finish express TESTING 
------------------------------
*/


/* Configure Database */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://newsnowtest.firebaseio.com"
});

var database = admin.database();

/* Query by JSON dictionary 
   Example Input: '{popularity: 1, date: "10-20-2017", source: "CNN", topic: "politics"}'
*/
function getArticlesByJSON(jsonString) {
	var obj = JSON.parse(jsonString);
	var keys = Object.keys(obj);
  var indexes = [];
  var result = [];
  var plist = [];
  keys.forEach(function(key) {
    var p = database.ref('articles').orderByChild(key).equalTo(obj[key]).once('value').then(function(snapshot) {
      if (snapshot.exists()) {
        snapshot.forEach(function(childSnapshot) {
          if (!indexes.includes(childSnapshot.key)) {
            var obj = childSnapshot.val();
            result.push(obj);
            indexes.push(childSnapshot.key);
          }
        });
      }
    });
    plist.push(p);
  });
  return Promise.all(plist).then(function() {
    return result;
  });
}

/* Query articles greater than popularity ordered by date */
function getArticlesGreaterThanPopularity(popularity) {
  var result = [];
	var p = database.ref('articles').orderByChild('popularity').startAt(popularity).once('value').then(function(snapshot) {
      if (snapshot.exists()) {
        var popularArticles = snapshot.val();
        var sorted = popularArticles.sort(function(a, b) {
            return parseFloat(b.date) - parseFloat(a.date);
        });
        sorted.forEach(function(a) {
          result.push(a);
        });
      }
	});
  return p.then(function() {
    return result;
  });
}

// POSSIBILITIES TO SOLVE THE GET ALL FUNCTIONS:
// 1. ITERATE THROUGH ALL AND RETURN A SET OF UNIQUE SOURCES
// 2. HAVE A NODE CALLED ALLSOURCES IN FIREBASE THAT APPENDS TO IT EVERYTIME YOU WRITE AN ARTICLE TO DATABASE
// 3. CHUNKING METHOD/ PAGINATION?? UNSURE ABOUT THIS ONE
// http://stackoverflow.com/questions/41173542/firebase-get-all-values-of-specific-key

/* Get all sources */
function getAllSources() {
  var result = [];
  var p = database.ref('allSources').once('value').then(function(snapshot) {
	if (snapshot.exists()) {
      var sources = snapshot.val();
      sources.forEach(function(s) {
          result.push(s);
      });
    }
  });
  return p.then(function() {
    return result;
  });
}

/* Get all topics */
function getAllTopics() {
  var result = [];
  var p = database.ref('allTopics').once('value').then(function(snapshot) {
    if (snapshot.exists()) {
      var topics = snapshot.val();
      topics.forEach(function(t){
        result.push(t);
      });
    }
  });
  return p.then(function() {
    return result;
  });
}


