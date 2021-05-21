const cron = require('node-cron');
const twitter = require('./twitter.js');

function startJobs() {
	cron.schedule('0 0 * * * *', () => {
		console.log('Generating a new tweet!');

		twitter.sendNewTweet();
	});
}

module.exports = { startJobs };