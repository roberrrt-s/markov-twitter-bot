/* global process */

const Twit = require('twit');
const sentiment = require('sentimental');

const util = require('./util.js');
const markov = require('./markov.js');

const Client = new Twit({
	consumer_key:         process.env.TWITTER_CONSUMER_KEY,
	consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
	access_token:         process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
	timeout_ms:           60 * 1000,  // optional HTTP request timeout to apply to all requests.
	strictSSL:            true,     // optional - requires SSL certificates to be valid.
});

function scrapeUserTweets(users) {
	return new Promise((resolve, reject) => {

		const allTweets = [];

		for (const user of users) {
			let tweets = getUserHistory(user);

			console.log(tweets);

			allTweets.push(tweets);
		}

		Promise.all(allTweets)
			.then(data => {
				resolve(data);
			})
			.catch(err => {
				reject(err);
			});

		function getUserHistory(user) {
			return new Promise((resolve, reject) => {



				// Client.get('statuses/user_timeline', {
				// 	screen_name: user,
				// 	count: 200,
				// 	tweet_mode: 'extended'
				// }, (err, data) => {
				// 	if(!err) {
				// 		resolve(data);
				// 	} else {
				// 		reject(err);
				// 	}
				// });
			});
		}

	});
}

// return new Promise((resolve, reject) => {
// 	let allTweets = [];

// 	function scrapeAllUserTweets(user) {
// 		return [user];
// 	}

// 	async function getAllUserTweets() {
// 		users.forEach(user => {
// 			const tweets = await scrapeAllUserTweets(user);
// 			allTweets.push(tweets);
// 		})

// 		if(allTweets.length > 0) {
// 			resolve(allTweets);
// 		} else {
// 			reject(allTweets);
// 		}
// 	}

// 	getAllUserTweets();
// });

function getUserReplyData(username) {
	return new Promise((resolve, reject) => {
		Client.get('statuses/user_timeline', {
			screen_name: username,
			count: 200,
			tweet_mode: 'extended',
			include_rts: false
		}, (err, data) => {
			if(!err) {
				resolve(data);
			} else {
				reject(err);
			}
		});
	});
}

function sendNewTweet() {

	markov.run()
		.then(result => {
			console.log('done running markov, result:');

			console.log(result);

			Client.post('statuses/update', {
				status: `${result.text}`,
			}, (err, data) => {
				if(data) {
					console.log('Posted a new general tweet');
				} else {
					console.log('Something went wrong!');
				}
			});

		}).catch(err => {
			console.log(err);
		});

}

function replyToTweet(tweet) {
	console.log(`Detected new tweet by ${tweet.user.screen_name} with ID: ${tweet.id_str} and a sentiment score of ${sentiment('NL', tweet.text || tweet.full_text)}`);

	getUserReplyData(tweet.user.screen_name)
		.then(data => {
			data = data
				.map(util.formatTextFromTweet)
				.map(util.convertTweetObjToMarkovReady)
				.filter(util.removeEmptyTweets);
			markov.run(data)
				.then(result => {
					console.log('done running markov, result:');

					Client.post('statuses/update', {
						status: `@${tweet.user.screen_name} ${result.text}`,
						in_reply_to_status_id: `${tweet.id_str}`
					}, (err, data) => {
						if(data) {
							console.log(`Posted reply to ${tweet.user.screen_name}`);
						} else {
							console.log('Something went wrong!');
						}
					});

				}).catch(err => {
					console.log(err);
				});
		})
		.catch(console.log);
}

module.exports = {
	Client,
	getUserReplyData,
	replyToTweet,
	sendNewTweet,
	scrapeUserTweets
};
