import { Serverless } from "serverless/aws";

const serverlessConfiguration: Serverless = {
	service: {
		name: "serverless-internal-auth",
		// app and org for use with dashboard.serverless.com
		// app: your-app-name,
		// org: your-org-name,
	},
	frameworkVersion: ">=1.72.0",
	custom: {
		webpack: {
			webpackConfig: "./webpack.config.js",
			includeModules: true,
		},
	},
	// Add the serverless-webpack plugin
	plugins: ["serverless-webpack"],
	provider: {
		name: "aws",
		runtime: "nodejs12.x",
		region: "ap-southeast-2",
		apiGateway: {
			minimumCompressionSize: 1024,
		},
		environment: {
			AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
		},
		iamRoleStatements: [
			{
				Effect: "Allow",
				Action: ["ses:SendEmail", "ses:SendRawEmail"],
				Resource: "*",
			},
		],
	},
	functions: {
		get: {
			handler: "handler.get",
			events: [
				{
					http: {
						method: "get",
						path: "get",
					},
				},
			],
		},
		send: {
			handler: "handler.send",
			events: [
				{
					http: {
						method: "post",
						path: "send"
					}
				}
			]
		}
	},
};

module.exports = serverlessConfiguration;
