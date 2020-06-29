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
	log.debug("Connected file router");
}

router.get('/*', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err, result) => {
		if (err) {
			res.next(createError(403, 'forbidden'));
		} else {
			var file = '.' + req.url;
			log.info(user.login + ' downloaded file ' + file);
  			res.download(file); // Set disposition and send it.
		}
	});
});


router.post('/:type', function(req, res, next) {
	next();	
});

module.exports = router;
