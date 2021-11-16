const fetch = require('node-fetch');

const {
	SecretsManagerClient,
	GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

exports.sbcStatus = async (req, res, next) => {
	// Verify that supplied param in the request contains valid IP address.
	if (
		!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
			req.params.ip
		)
	) {
		return res.status(400).send({
			status: 'failure',
			message: 'Supplied IP address is incorrect.',
		});
	}

	// This function attempts to retrieve secrete from the AWS SM store,
	// On success it returns string value of the secret.
	const getSecret = async (secretId, region) => {
		// Set param with name of the secret store.
		const params = {
			SecretId: secretId,
		};

		// Instantiate Secret Manager client.
		const client = new SecretsManagerClient({
			region: region,
		});

		// Instantiate command
		const getSecretValue = new GetSecretValueCommand(params);

		try {
			// Call AWS SM Store.
			const data = await client.send(getSecretValue);

			// Return success with value to the secret.
			return { status: 'success', secretString: data.SecretString };
		} catch (err) {
			// Return errors.
			return {
				status: 'failure',
				statusCode: 500,
				message:
					`Failed to fetch connection string from SM with message: ${err.message}` ||
					'AWS API Call Failure',
			};
		}
	};

	// This function sends API request to AudioCodes SBC.
	const getSbcStatus = async (ipv4address, auth) => {
		// Prepare headers for the request.
		const reqHeaders = {
			Authorization: auth,
			Connection: 'keep-alive',
			contentType: 'application/json',
		};

		// Set request method and add headers.
		const reqOptions = {
			method: 'GET',
			headers: reqHeaders,
			timeout: 7000,
		};

		try {
			const response = await fetch(
				`http://${ipv4address}/api/v1/status`,
				reqOptions
			);

			// Client 3xx-5xx errors.
			if (response.status !== 200) {
				return {
					status: 'failure',
					message: `Failed to get SBC status. The following error was received from downstream device: ${response.statusText}`,
				};
			}

			// Handling successful response.
			const responseData = await response.json();
			return {
				status: 'success',
				data: responseData,
			};
		} catch (err) {
			// All other errors including network.
			return {
				status: 'failure',
				message: `${err}`,
			};
		}
	};

	// Calling getSecret function which retrieves authorisation string from AWS SM store.
	const secret = await getSecret(
		process.env.AWS_SECRET_NAME,
		process.env.AWS_SECRETE_REGION
	);

	// If unable to fetch secrete from the SM store, return failure to the client.
	if (secret.status === 'failure') {
		return res.status(500).send({ status: 'failure', message: secret.message });
	}

	// Calling function which sends GET /api/v1/status API request to the Audiocodes SBC.
	const sbcStatus = await getSbcStatus(req.params.ip, secret.secretString);

	// If failed to fetch SBC status, return failure to the client.
	if (sbcStatus.status === 'failure') {
		return res
			.status(500)
			.send({ status: 'failure', message: sbcStatus.message });
	}

	// Final and successful response to the client with SBC status data.
	return res.status(200).send({
		status: 'success',
		data: sbcStatus.data,
	});
};

exports.test = async (req, res, next) => {
	res.status(200).send({
		status: 'success',
		message: 'Test Page!',
	});
};
