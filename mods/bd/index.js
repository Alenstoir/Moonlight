var mysql = require('mysql'), mysqlUtil = require('mysql-utilities');
var config = require('../../config');
var async = require('async');

var connection = mysql.createConnection(config.get('bdOptions'));

/*
async.series([
	open,
	deleteUsers,
	createUsers,
	close
], function(err, field){
	console.log(arguments);
});
*/
function open(callback){
	connection.connect(callback);
	mysqlUtil.upgrade(connection);
	mysqlUtil.introspection(connection);
}

function deleteUsers(callback){
	connection.delete(
		'user',
		{id: '>1'},
		callback
	);
}


function createUsers(callback){
	var users = [
		{login: 'user1'},
		{login: 'user2'},
		{login: 'user3'},
	];

	async.each(users, function(uData, callback){
		uData = uData.login;
		connection.insert(
			'user', {
				login: uData,
				password: 'asd',
				salt: 'asd',
				email: 'asd',
				phone: 'asd'
			},
			callback
		);
	}, callback);
}


function close(callback){
	connection.end(callback);
}


module.exports = {connection, open, close};