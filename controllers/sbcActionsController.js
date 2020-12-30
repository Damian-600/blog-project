exports.test = async (req, res, next) => {
	res.status(200).send({
		status: 'success',
		message: 'Test Page!',
	});
};
