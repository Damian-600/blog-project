const fs = require('fs').promises;
const fetch = require('node-fetch');
const FormData = require('form-data');

exports.newTenant = async (req, res, next) => {
	// Verify mandatory data is not missing
	if (
		!req.body.tenantName ||
		!req.body.cacLimit ||
		!req.body.trunkFqdn ||
		!req.body.sbcIp ||
		!req.headers.authorization
	) {
		return res.status(400).send({
			status: 'failure',
			message: 'Request body missing mandatory data.',
		});
	}

	// Read CLI Template from file
	const cliTemplate = await fs.readFile(
		'./resources/addTenantTemplate.txt',
		'utf8',
		(err, data) => {
			if (err) {
				return res.status(500).send({
					status: 'failure',
					message: 'Failed to read cli template file from local disk.',
				});
			}
			return data;
		}
	);

	// Replace placeholder values with data from request body
	const cliScript = cliTemplate.replace(
		/(\[TENANT_NAME\])|(\[TRUNK_FQDN\])|(\[CAC_LIMIT\])/gi,
		function (str, p1, p2, p3) {
			if (p1) return req.body.tenantName;
			if (p2) return req.body.trunkFqdn;
			if (p3) return req.body.cacLimit;
		}
	);

	// Prepare body for the request towards SBC
	const formBody = new FormData();
	formBody.append('file', cliScript, {
		filename: 'cli.txt',
		contentType: 'text/plain',
	});

	// Prepare headers for the request. Note passthrough authentication from client to SBC.
	const reqHeaders = {
		Authorization: req.headers.authorization,
		Connection: 'keep-alive',
	};

	// Set request method and add headers
	const reqOptions = {
		method: 'PUT',
		headers: reqHeaders,
		body: formBody,
		redirect: 'follow',
		timeout: 7000,
	};

	// Upload CLI script to SBC
	try {
		const uploadRes = await fetch(
			`http://${req.body.sbcIp}/api/v1/files/cliScript/incremental`,
			reqOptions
		);

		// Client 3xx-5xx errors
		if (uploadRes.status !== 200) {
			return res.status(400).send({
				status: 'failure',
				message: `Failed to upload CLI to SBC. The following error was received from downstream device: ${uploadRes.statusText}`,
			});
		}

		// Handling successful uploads

		const responseData = await uploadRes.json();
		return res.status(200).send({
			status: 'success',
			data: responseData.description,
		});
	} catch (err) {
		// All other errors including network
		return res.status(500).send({
			status: 'failure',
			message: `${err}`,
		});
	}
};

exports.test = async (req, res, next) => {
	res.status(200).send({
		status: 'success',
		message: 'Test Page!',
	});
};
