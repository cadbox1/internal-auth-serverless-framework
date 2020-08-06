import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { SES } from "aws-sdk";
import jwt from "jsonwebtoken";

const ses = new SES();

const allowedDomain = process.env.ALLOWED_DOMAIN || "cadell.dev";

const secret = process.env.SECRET || "secret";

interface TokenData {
	email: string;
}

export const get: APIGatewayProxyHandler = async (event, _context) => {
	const { headers } = event;
	const { Authorization } = headers;
	if (!Authorization || !Authorization.startsWith("Bearer ")) {
		return {
			statusCode: 403,
			body: JSON.stringify({
				validation: {
					field: "Authorization",
					message: "Authorization is required",
				},
			}),
		};
	}

	const token = Authorization.replace(/Bearer /g, "");
	let tokenData: TokenData;
	try {
		tokenData = jwt.verify(token, secret);
	} catch (error) {
		return {
			statusCode: 403,
			body: JSON.stringify({
				validation: {
					field: "Authorization",
					message: "Token not valid",
				},
			}),
		};
	}

	return {
		statusCode: 200,
		body: JSON.stringify({
			email: tokenData.email,
		}),
	};
};

interface SendBody {
	email: string;
}

export const send: APIGatewayProxyHandler = async (event, _context) => {
	const data: SendBody = JSON.parse(event.body);
	const { email } = data;
	if (!email) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				validation: {
					field: "email",
					message: "Email is required",
				},
			}),
		};
	}

	if (!email.endsWith("@" + allowedDomain)) {
		return {
			statusCode: 403,
			body: JSON.stringify({
				validation: {
					field: "email",
					message: "Email address is not allowed",
				},
			}),
		};
	}

	const tokenData: TokenData = {
		email,
	};

	const token = jwt.sign(tokenData, secret, { expiresIn: "1h" });

	const params: SES.Types.SendEmailRequest = {
		Destination: {
			ToAddresses: [email],
		},
		Message: {
			Subject: {
				Data: "Magic link for internal auth service",
			},
			Body: {
				Html: {
					Data: `Token: ${token}`,
				},
				Text: {
					Data: `Token: ${token}`,
				},
			},
		},
		Source: "hello@cadell.dev",
	};

	try {
		await ses.sendEmail(params).promise();
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "email sent succesfully",
			}),
		};
	} catch (error) {
		console.error(error, error.stack);
		return {
			statusCode: 503,
			body: JSON.stringify({
				message: "something went wrong :(",
			}),
		};
	}
};
