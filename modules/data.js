/* global process */

const fse = require('fs-extra');
const path = require('path');

const util = require('./util.js');
const twitter = require('./twitter.js');

function readTweetsFromFile() {
	return new Promise((resolve, reject) => {
		fse.readdir('./data')
			.then(filenames => {
				return filenames.map(filename => path.join('./data', filename));
			})
			.then(filepaths => {
				return filepaths
					.filter(filepath => !filepath.startsWith('data/.') )
					.map(filepath => fse.readFile(filepath, 'utf-8')
						.then(filecontents => filecontents));
			})
			.then(files => Promise.all(files))
			.then(files => {
				let tweets = [];

				for (const [key, value] of Object.entries(files)) {
					console.log(`Parsing file ${Number(key) + 1}/${Object.keys(files).length}`);
					tweets.push(...JSON.parse(value));
				}

				util.shuffleArray(tweets);

				console.log(tweets.length);

				let data = {
					replies: tweets.filter(util.filterTweets, ['Reply']).map(util.convertTweetObjToMarkovReady),
					// retweets: tweets.filter(util.filterTweets, ['Reply']).map(util.convertTweetObjToMarkovReady),
					tweets: tweets.filter(util.filterTweets, ['Tweet']).map(util.convertTweetObjToMarkovReady)
				};

				resolve(data);
			})
			.catch(err => {
				reject(err);
			});
	});
}

function scrapeTweetsFromTwitter() {
	return new Promise((resolve, reject) => {
		twitter.scrapeUserTweets(process.env.TWITTER_USERS.split(' '))
			.then(data => {
				resolve(
					data.flatMap(user => {
						return user.map(tweet => {
							return tweet.full_text;
						});
					})
				);
			})
			.catch(err => {
				reject(err);
			});
	});
}


module.exports = new Promise((resolve, reject) => {
	scrapeTweetsFromTwitter().then(data => {
		resolve(data);
	}).catch(err => {
		reject(err);
	});
});

