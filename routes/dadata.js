var log = require('../mods/log')(module);
var users = require('../mods/user');
var vars = require('../mods/vars');
var express = require('express');
var bd = require('../mods/bd');
var router = express.Router();
var async = require('async');
var path = require('path');
var fs = require('fs');

/* GET home page. */



if(module.parent){
	log.debug("Connected dadata router");
}

router.post('/', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next(err);
		}
  		res.render('rasp');
	});
	
});

module.exports = router;
