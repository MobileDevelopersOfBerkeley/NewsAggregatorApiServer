var admin = require("firebase-admin");
var serviceAccount = require("./newsnowtest-firebase-adminsdk-r2185-e476e5c430.json");
var router = require("express").Router();

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
	return database.ref('articles').orderByChild('popularity').startAt(popularity).once('value').then(function(snapshot) {
      if (snapshot.exists()) {
        result = snapshot.val();
        var popularArticles = [];
        for (var key in result) {
            popularArticles.push(result[key]);
        }
        var sorted = popularArticles.sort(function(a, b) {
            return parseFloat(b.publishedAt) - parseFloat(a.publishedAt);
        });
        return sorted;
      }
      return {}
	});
}

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

function _wrapPromise(p, res) {
  return p.then(function(result) {
    res.send(result);
  }).catch(function(error) {
    res.send(error.toString());
  });
}

router.post("/getArticlesByJSON", function(req, res) {
  var p = getArticlesByJSON(req.body.jsonString);
  _wrapPromise(p, res);
});

router.post("/getArticlesGreaterThanPopularity", function(req, res) {
  var p =getArticlesGreaterThanPopularity(req.body.popularity);
  _wrapPromise(p, res);
});

router.post("/getAllSources", function(req, res) {
  var p = getAllSources();
    _wrapPromise(p, res);
});

router.post("/getAllTopics", function(req, res) {
  var p = getAllTopics();
  _wrapPromise(p, res);
});

module.exports = router;

