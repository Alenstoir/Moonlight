var log = require('../../mods/log')(module);
var createError = require('http-errors');
var bd = require('../../mods/bd');
var crypto = require('crypto');
var async = require('async');

class User  {
	id = "";
	fio = "";
	login = "";
	password = "";
	salt = "";
	email = "";
	phone = "";
	userIco = "";
	level = "";
	inn = "";
	location = "";
	related_org = "";
	relation_key = "";

	getRaw = function() {
		var raw = {		
			login: this.login,
			fio: this.fio,
			email: this.email,
			phone: this.phone,
			userIco: this.userIco,
			level: this.level,
			location: this.location,
			related_org: this.related_org,
			relation_key: this.relation_key
		};
		return raw;
	}

	save = async function(callback) {
		var raw = {
			login: this.login,
			fio: this.fio,
			email: this.email,
			phone: this.phone,
			userIco: this.userIco,
			level: this.level,
			inn: this.inn,
			location: this.location,
			related_org: this.related_org,
			relation_key: this.relation_key	
		}
		let promise = new Promise(resolve => { bd.connection.update(
			'user',
			raw,
			{
				id: this.id
			},
			(err, result) => resolve({err, result}))});
		let result = await promise;
		console.log(result);
		callback(result);
	}

	createRelation = function(){
		this.relation_key = crypto.createHmac('sha1', this.login).update(this.login).digest('hex');
	}

	load = async function(login, callback) {
		let promise = new Promise(resolve => { bd.connection.queryRow(
			'SELECT * FROM user WHERE login = "' + login + '"',
			(err, result) => resolve({err, result}))});
		let result = await promise;
		if (!result.result) {
		}
		if (result.err) {
			throw result.err;
		};
		this.id = result.result.id;		
		this.fio = result.result.fio;				
		this.login = result.result.login;
		this.password = result.result.password;
		this.salt = result.result.salt;
		this.email = result.result.email;
		this.phone = result.result.phone;
		this.inn = result.result.inn;
		this.userIco = result.result.userIco;
		this.level = result.result.level;
		this.location = result.result.location;
		this.related_org = result.result.related_org;
		this.relation_key = result.result.relation_key;
		log.debug("Loaded user info: " + this.login + " ::: " + this.id);
		callback(result.err, result.result);
	};
	auth = function(login, password, callback) {
		var tempUser = this;
		async.waterfall([
			function(callback) {
				tempUser.load(login, callback);
				console.log(login);
				console.log(password);
			},
			function(err, callback) {
				if (tempUser.checkPassword(password)) {
					log.debug("Auth on user info: " + tempUser.login + " ::: " + tempUser.id + " success");
					callback(null, true);
				} else {
					log.debug("Auth on user info: " + tempUser.login + " ::: " + tempUser.id + " deny");
					callback(createError(403, "Bad password"), false);
				}
			}
		], function(err, result) {
			if (err) {
				return callback(err);
			}
			callback(null);
		})
	};
	checkPassword = function(pass) {
		return this.encryptPass(pass) === this.password;
	};
	encryptPass = function(pass) {
		return crypto.createHmac('sha1', this.salt).update(pass).digest('hex');
	};
	setPassword = function(pass) {
		this.salt = Math.random() + ''; 
		this.password = this.encryptPass(pass);
		bd.connection.update(
			'user', 
			{ password: this.password, salt: this.salt },
			{ id: this.id },
			(err, res) => {
				if (err) {
					log.debug("User info password changed: " + this.login + " ::: " + this.id + " deny");
					console.log(err);
				} else {
					log.debug("User info password changed: " + this.login + " ::: " + this.id + " success");
					log.debug("UserID " + this.id + " password updated");
				}
			}
		);
	};
	create = async function(fio, login, password, email, phone, level, callback) {
		this.fio = fio;
		this.login = login;
		this.salt = Math.random() + ''; 
		this.password = this.encryptPass(password);
		this.email = email;
		this.phone = phone;
		this.level = level;
		let promise = new Promise(resolve => { bd.connection.insert(
			'user', {
				fio: this.fio,
				login: this.login,
				password: this.password,
				salt: this.salt,
				email: this.email,
				phone: this.phone,
				userIco: "img/user.png",
				level: this.level
			},
			(err, result) => resolve({err, result})
		)});
		let result = await promise;
		log.debug("Created user info: " + this.login);
		callback(result.err, result.result);
	}
}

module.exports = User;