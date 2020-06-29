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
	log.debug("Connected index router");
}

router.get('/', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err, result) => {
		if (err) {
			next(err);
		} else if (result) {
			res.locals.level = user.level;
			if(req.session.nextClick) {
				let click = req.session.nextClick;
				req.session.nextClick = null;
	  			res.render('index', { title: 'Moonlight', currentUser: req.session.login, userPic: user.userIco, redir: undefined, click: click});
			} else {
	  			res.render('index', { title: 'Moonlight', currentUser: req.session.login, userPic: user.userIco, redir: undefined});
			}
		} else {
  			res.render('indexBlank', { title: 'Moonlight'});
		}
	});
	
});

router.post('/', function(req, res, next) {
  res.render('cover');

});


router.get('/register', function(req, res, next) {
	res.render("register", { title: 'Moonlight'});
});
router.post('/login', function(req, res, next) {
	if (req.method == "POST") {
		var user = new users;
		console.log(req.body);
		user.auth(req.body.login, req.body.pass, (err, result) =>{
			if (err) {
				next(err);
			} else {
				res.locals.level = user.level;
				req.session.login = user.login;
				console.log("logged");
				res.redirect('/');
			}
		})
		/*
		async.waterfall([
			function(callback){
				console.log(req.body.login);
				log.debug("selected " + req.body.login);
				bd.connection.queryRow('SELECT * FROM user WHERE login like "'+req.body.login+'"', [2], callback(null, row));
			}
		], function(err, row){
			if (row) {
				if (row.password == req.body.pass) {
					req.session.login = req.body.login;
					res.redirect('/');
				}
			}
		});*/
	}
});

router.post('/logout', function(req, res, next) {
	if (req.method == "POST") {
		req.session.destroy();
		res.locals.level = "-1";
		res.send({});
	}
})

module.exports = router;
