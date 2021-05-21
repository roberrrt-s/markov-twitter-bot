/* global process */

const twitter = require('./twitter.js');

function connectToTwitter() {
	const stream = twitter.Client.stream('statuses/filter', { track: `@${process.env.TWITTER_USERNAME}` });

	stream.on('connect', () => {
		console.log('Connected to Twitter');
	});

	stream.on('disconnect', () => {
		console.log('Disconnected from Twitter');
	});

	stream.on('tweet', () => {
		// console.log('dit kan de reden zijn');
	});

	stream.on('message', tweet => {
		console.log('new tweet detected!');
		twitter.replyToTweet(tweet);
	});

	stream.on('error', err => {
		console.log(err);
	});
}

module.exports = { connectToTwitter };