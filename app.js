require('dotenv').config();

// Modules
const getData = require('./modules/data.js');
const stream = require('./modules/stream.js');
const markov = require('./modules/markov.js');
const cron = require('./modules/cron.js');
const twitter = require('./modules/twitter.js');

getData.then(data => {
	console.log('Data is imported, connecting stream to twitter (well, normally)');
	stream.connectToTwitter();
	markov.exposeDatasetToMarkov(data);
	cron.startJobs();
	twitter.sendNewTweet();
});