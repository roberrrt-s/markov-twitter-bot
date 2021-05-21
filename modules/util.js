function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function randomNumber(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function filterTweets(tweet) {
	return tweet['Tweet Type'] === String(this);
}

function formatTextFromTweet(tweet) {
	return { Text: tweet.full_text || tweet.text };

}

function convertTweetObjToMarkovReady(tweet) {
	tweet = tweet['Text'];
	tweet = tweet
		.replace(/(@)[\n\S]+/g, '')
		.replace(/(?:https?):\/\/[\n\S]+/g, '')
		.replace(/RT\s+/g, '')
		.replace('&amp;', '')
		.replace('&lt;', '')
		.replace('&gt;', '')
		.replace(/&gt;+/g,'')
		.replace(/#/g, '')
		.replace(/\s+/g, ' ')
		.replace(/�/g, '')
		.trim();

	return tweet;
}

function removeEmptyTweets(tweet) {
	return tweet.length > 5;
}

module.exports = {
	shuffleArray,
	randomNumber,
	filterTweets,
	formatTextFromTweet,
	convertTweetObjToMarkovReady,
	removeEmptyTweets
};