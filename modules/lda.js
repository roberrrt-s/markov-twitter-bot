const LDA = require('lda');

function runLDA(content) {
	const topics = LDA(content, 5, 10, ['en', 'nl']).flat();

	return topics.map(topic => topic.term);
}

module.exports = runLDA;