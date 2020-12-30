const express = require('express');
const morgan = require('morgan');

const sbcRouter = require('./routes/blogRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

app.use(express.json());

// 2) ROUTERS
app.use('/', sbcRouter);

app.all('*', (req, res, next) => {
	res.status(404).send({
		status: 'failed',
		message: `Can't find ${req.originalUrl} on this server!`,
	});
});

module.exports = app;
