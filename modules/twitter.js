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

function getUserHistory(user, res, rej) {
	console.log(`Starting scrape of ${user}`);

	requestMaxStatuses(tweets => {
		if(tweets) {
			res(tweets);
		} else {
			rej('Something went wrong');
		}
	});

	function requestMaxStatuses(onComplete, lastId, allTweetData) {
		console.log('Requesting max (200) amount of tweets from Twitter');

		var args = {
			screen_name: user,
			count: 200,
			tweet_mode: 'extended',
			include_rts: false
		};

		if(lastId) args.max_id = lastId;

		Client.get('statuses/user_timeline', args, (err, data) => {
			if(!err) {

				// Assume we have data...
				if(data.length > 1) {
					console.log(`found new tweets by ${user}!`);
					console.log(`new number of tweets: ${data.length}`);

					const latestTweetId = parseInt(data[data.length - 1].id_str);

					let allTweets = allTweetData || [];

					allTweets.push(...data);

					console.log(`total number of tweets for ${user}: ${allTweets.length}`);

					console.log(`latest tweet id: ${latestTweetId}`);

					requestMaxStatuses(onComplete, latestTweetId, allTweets);

				} else {
					console.log('Unable to scrape new tweets.');
					console.log(`Scraped all available tweets by ${user} (${allTweetData.length})`);
					onComplete(allTweetData);
				}
			} else {
				onComplete(err);
			}
		});
	}
}

function scrapeUserTweets(users) {
	return new Promise((resolve, reject) => {

		const allTweets = [];

		for(let i = 0; i < users.length; i++) {
			allTweets.push(new Promise((resolve, reject) => {
				getUserHistory(users[i], resolve, reject);
			}));
		}

		Promise.all(allTweets)
			.then(data => {
				resolve(data);
			}).catch(err => {
				reject(err);
			});

	});
}

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
