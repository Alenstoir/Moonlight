var log = require('../mods/log')(module);
var createError = require('http-errors');
var formidable = require('formidable');
var users = require('../mods/user');
var vars = require('../mods/vars');
var express = require('express');
var bd = require('../mods/bd');
var router = express.Router();

/* GET users listing. */

if(module.parent){
	log.debug("Connected users router");
}

router.post('/', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next(err);
		}
		if (user.level == 0) {
			bd.connection.queryHash(
				'SELECT * FROM user',
				(err, result) => {
					if (err) {
						throw err;
					} else {
						res.render("users", {user: result});
					}
				}
			)
		} else {
			next(createError(403, "Access denied"));
		}
		
	});
	
});

router.post('/:type', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next(err);
		}
		switch(req.params.type) {
			case 'profile': {
				if (user.level == 2) {
					bd.connection.queryRow(
						'SELECT fio FROM user WHERE id = "' + user.related_org + '"',
						(err, result) => {
							user.related_org = result.fio;
							res.render("layout/lk", {result: user.getRaw()});	
						}
					)
				} else {
					res.render("layout/lk", {result: user.getRaw()});	
				}
				break;				
			}
			case 'loadImage' : {
				new formidable.IncomingForm().parse(req)
					.on('fileBegin', (name, file) => {
				        file.path = './public/img/' + user.login + "." + file.name.split('.').pop()
				    })
				    .on('file', (name, file) => {
				     	log.info('Uploaded file ' + file.name + ' from ' + user.login + ' as profile ico');
				     	user.userIco = file.path.split('/');
				     	user.userIco.splice(0, 2)
				     	user.userIco = user.userIco.join('/');
				     	var result = user.save((result) => {
							if (result.err) {
								res.send(false);
							} else {
								res.send({result: true, path: user.userIco});
							}
						});
				    });
				break;
			}
			case 'getKey' : {
				bd.connection.queryRow(
					'SELECT id FROM user WHERE level = 1 and relation_key = "' + req.body.key + '"',
					(err, result) => {
						res.send(result);
					}
				)
				break;
			}
			case 'getLogins' : {
				bd.connection.queryRow(
					'SELECT id FROM user WHERE login = "' + req.body.login + '"',
					(err, result) => {
						res.send(result);
					}
				)
				break;
			}
			case 'create' : {
				console.log(req.body);
				switch(req.body.level) {
					case '1': {
						bd.connection.insert(
							'bank_data',
							{
								inn: req.body.inn,
								kpp: req.body.kpp,
								ogrn: req.body.ogrn
							},
							(err, result) => {
								console.log(err);
								console.log(result);
								var tempUser = new users;
								tempUser.create(
									req.body.fio, req.body.login, req.body.pass, req.body.email, req.body.phone, '1',
									(err, result) => {
										tempUser.load(tempUser.login, (err) => {
											tempUser.inn = req.body.inn;
											tempUser.location = req.body.locations;
											tempUser.createRelation();
											tempUser.save((result) => {
												console.log(result);
												res.locals.level = tempUser.level;
												req.session.login = tempUser.login;
												res.redirect('/');
											});
										})										
									}
								)
							}
						)
						break;
					}
					case '2': {
						console.log(req.body);
						var tempUser = new users;
						tempUser.create(
							req.body.fio, req.body.login, req.body.pass, req.body.email, req.body.phone, '2',
							(err, result) => {
								tempUser.load(tempUser.login, (err) => {
									tempUser.related_org = req.body.orgId;
									tempUser.save((result) => {
										console.log(result);
										res.locals.level = tempUser.level;
										req.session.login = tempUser.login;
										res.redirect('/');
									});
								})										
							}
						)
						break;
					}
				}
				break;
			}
			case 'edit' : {
				switch(req.body.field) {
					case 'fio' : {
						user.fio = req.body.value
						break;
					}
					case 'email' : {
						user.email = req.body.value
						break;
					}
					case 'phone' : {
						user.phone = req.body.value
						break;
					}
					case 'image' : {
						console.log(req.body.value);
						//user.image = req.body.value
						break;
					}
					case 'location' : {
						user.location = req.body.value
						break;
					}
				}
				console.log(req.body);
				var result = user.save((result) => {
					if (!result.result) {
						res.send(false);
					} else {
						res.send(true);
					}
				});
				break;
			}
		}
		//next(createError(403, "Access denied"));
		
		
	});
	
});

module.exports = router;
