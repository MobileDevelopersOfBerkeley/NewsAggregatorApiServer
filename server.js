// DEPENDENCIES
var firebaseRouter = require('./firebase.js');
var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");

// ENVIRONMENT VARS
const port = process.env.PORT || 8080;

// INIT EXPRESS
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", firebaseRouter);

// START EXPRESS
var server = app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server listening at http://%s:%s", host, port);
});