var winston = require('winston');
const pathM = require('path');
const {format, transports} = winston;

module.exports = function(module){
	return makeLogger(module.filename);
};

const logFormat = format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`)

function makeLogger(path){
	sub = path.split('\\').slice(-2).slice(0, 1);
	path = pathM.basename(path, '.js');
	var transports = [
		new winston.transports.File({
			filename: './logs/'+sub+'-'+path.split(/[\\/]/).pop()+'.log',
			level: 'debug',
			format: format.combine(
			)
		}),
		new winston.transports.Console({
			format: format.combine(
				format.colorize(),
				logFormat
			),
			label: path
		}),

	];
	return new winston.createLogger({
		level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', 
		format: format.combine(
			format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			format.label({ label: sub+'/'+path}),
			format.json(),
			format.metadata({ fillExcept: ['timestamp', 'level', 'label', 'message']}),

			format.simple()
		),
		transports: transports 
	});
}