// app.js

'use strict';


var express = require('express');					// https://github.com/expressjs/express
var elasticsearch = require('elasticsearch');		// https://github.com/elastic/elasticsearch-js
var request = require('request');					// https://github.com/request/request


/* Elastic Search ============================ */

var client = new elasticsearch.Client( {  
    host: 'search-cs499-a4-hmdj2wt4kla6i7ccsgfqroydhe.us-east-1.es.amazonaws.com'
});

/* Send a HEAD request to / and allow up to 3 seconds for it to complete. */
client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 3000
}, function (error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
  	    console.log('elasticsearch is well');
 	}
});


/* This function retrieves data from the api every 30 seconds
 * The api returns the current location of the International Space Station. 
 * The data is then inserted into the ElasticSearch server */
var addDataToES = function () {
	var f = setInterval(function() {
		request('http://api.open-notify.org/iss-now.json', function (err, res, body) {
			if (!err && res.statusCode == 200) { // success
				var data = JSON.parse(body);	
				client.index({
                    index: 'iss',
                    type: 'iss',
                    body: data
                }, function (err, res) {
                	if (res) {
                		console.log('Data added to ES. Longitude: ' + data.iss_position.longitude + '. Latitude:' + data.iss_position.latitude);
                		console.log(res); 	
                	} else {
                		console.log(err);
                	}     
                	console.log();               
                })				
			} else { // failure
				console.error('error:', err); 
			}
		})
	}, 30*1000);
}



/* Express App =============================== */

var app = express();

/* Allow CORS */
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
	res.send('App is running. Preparing to store data into Elastic Search...');
    addDataToES();
})

app.listen(5000, function() {
    console.log('Server listening on port 5000...')
})