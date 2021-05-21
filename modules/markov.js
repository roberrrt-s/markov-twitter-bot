const Markov = require('markov-strings').default;
const sentiment = require('sentimental');
const util = require('./util.js');

let dataset = [];

function exposeDatasetToMarkov(data) {
	if(data) {
		dataset = data;
		console.log('Succesfully exposed dataset to Markov:');
		console.log(`Total tweets: ${dataset.tweets.length}`);
		console.log(`Total replies: ${dataset.replies.length}`);
	}
}

function generateMarkov(type) {

	const chain = new Markov({ stateSize: 3});
	let randomReplies = [];

	switch(type) {
	case 'reply':
		randomReplies.push(...dataset.replies);
		util.shuffleArray(randomReplies);
		randomReplies.length = util.randomNumber(1500, 2000);
		chain.addData(randomReplies);
		break;
	case 'tweets':
		chain.addData([...dataset.tweets]);
		break;
	default:
		return false;
	}

	return chain;
}

function run(userTweets) {
	return new Promise((resolve, reject) => {
		function init() {

			const chain = generateMarkov(userTweets ? 'reply' : 'tweets');

			userTweets ? chain.addData(userTweets) : null;

			new Promise((resolve, reject) => {
				let createdTweet;
				let i = 15;
				let j = 4;

				do {
					if(i > 2) {
						i--;
					} else if(j > 3) {
						j--;
					}

					try {
						createdTweet = chain.generate({
							maxTries: 999, // Give up if I don't have a sentence after 999 tries (default is 10)

							// If you want to get seeded results, you can provide an external PRNG.
							prng: Math.random, // Default value if left empty

							// // You'll often need to manually filter raw results to get something that fits your needs.
							filter: (result) => {
								//console.log(`[Attempt #${Date.now()}] | Generated result with refs: ${result.refs.length} and score ${result.score}`);

								let hasNoCompleteMatch = result.refs.filter(i => {
									return i.string.indexOf(result.string) > -1;
								});

								return result.string.split(' ').length >= 6 &&
									result.string.endsWith('.') &&
									result.string.length < 270 &&
									result.refs.length > 2 &&
									!hasNoCompleteMatch.length;
							}
						});
						console.log(`rolling score (${createdTweet.score}) & refs (${createdTweet.refs.length})`);
					}
					catch(error) {
						console.log('failed to generate Markov');
						init();
						return false;
					}
				} while(createdTweet.refs.length < j || createdTweet.score < i);

				if(createdTweet) {
					resolve(createdTweet);
				} else {
					reject();
				}

			}).then(newTweet => {

				newTweet.string = newTweet.string.replace('  ', ' ');

				let exportTweet = {
					text: newTweet.string,
					refs: newTweet.refs,
					score: newTweet.score,
					sentiment: sentiment('NL', newTweet.string),
					length: newTweet.string.length
				};

				resolve(exportTweet);
			}).catch(err => {
				reject(err);
			});
		}

		init();
	});
}

module.exports = { run, exposeDatasetToMarkov };
