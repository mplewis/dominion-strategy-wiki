import * as pino from "pino";

export const log = pino.default({
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "HH:MM:ss",
			ignore: "pid,hostname",
		},
	},
});
