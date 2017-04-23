var admin = require("firebase-admin");
var serviceAccount = require("./newsnowtest-firebase-adminsdk-r2185-e476e5c430.json");
var router = require("express").Router();

/* Configure Database */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://newsnowtest.firebaseio.com"
});

var database = admin.database();

/* Returns articles that match params
   Example Input: '{popularity: 1, date: "10-20-2017", source: "CNN", topic: "politics"}'
*/
function queryArticles(params) {
  var satisfiesQuery = function(article, params) {
    for (var key in params) {
      if (article[key] != params[key]) {
        return false;
      }
    }
    return true;
  };
  return database.ref("articles").orderByChild("date").once("value").then(function(snapshot) {
    if (snapshot.exists()) {
      unfiltered = snapshot.val();
      filtered = [];
      for (var key in unfiltered) {
        if (satisfiesQuery(unfiltered[key], params)) {
          filtered.push(unfiltered[key]);
        }
      }
      filtered.sort(function(a, b) {
        return b.popularity - a.popularity;
      });
      return filtered;
    }
    return [];
  });
}

/* Query articles greater than popularity ordered by date */
function getArticlesGreaterThanPopularity(popularity) {
  var result = [];
  popularity = parseInt(popularity);
	return database.ref('articles').orderByChild('popularity').startAt(popularity).once('value').then(function(snapshot) {
      if (snapshot.exists()) {
        result = snapshot.val();
        console.log(result);
        var popularArticles = [];
        for (var key in result) {
            popularArticles.push(result[key]);
        }
        var sorted = popularArticles.sort(function(a, b) {
            return parseFloat(b.publishedAt) - parseFloat(a.publishedAt);
        });
        return sorted;
      }
      return {};
	});
}

function getArticlesBySources(sources) {
  var plist = [];
  for (var i = 0; i < sources.length; i++) {
    plist.push(queryArticles({"source" : sources[i]}));
  }
  return Promise.all(plist).then(function(result) {
    var articles = [];
    for (var i = 0; i < result.length; i++) {
      articles.push.apply(articles, result[i]);
    }
    articles.sort(function(a, b) {
      return b.popularity - a.popularity;
    });
    return articles;
  });
}

/* Get articles. TODO: implement parameters to filter */
function getSources() {
  return database.ref('sources').once('value').then(function(snapshot) {
	if (snapshot.exists()) {
      var sources = snapshot.val();
      return sources;
    }
  });
}

/* Get all sources. DO NOT USE, THIS IS DEPRECATED */
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

router.post("/queryArticles", function(req, res) {
  var p = queryArticles(req.body);
  _wrapPromise(p, res);
});

router.post("/getArticlesGreaterThanPopularity", function(req, res) {
  var p =getArticlesGreaterThanPopularity(req.body.popularity);
  _wrapPromise(p, res);
});

router.post("/getArticlesBySources", function(req, res) {
  console.log(req.body);
  var sources = JSON.parse(req.body.sources);
  var p = getArticlesBySources(sources);
  _wrapPromise(p, res);
});

router.post("/getAllSources", function(req, res) {
  var p = getAllSources();
    _wrapPromise(p, res);
});

router.post("/getSources", function(req, res) {
  var p = getSources();
    _wrapPromise(p, res);
});

router.post("/getAllTopics", function(req, res) {
  var p = getAllTopics();
  _wrapPromise(p, res);
});

module.exports = router;
