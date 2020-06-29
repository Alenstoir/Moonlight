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
	log.debug("Connected save router");
}

router.post('/:type', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next(err);
		}
		switch(req.params.type) {
			case "address": {
				if (req.body.street == '') {
					res.send(false);
				} else {
				full_name = req.body.city + ", " + req.body.street + ", " + req.body.house;
					bd.connection.insert(
						'location',
						{
							_index: req.body.index,
							region: req.body.region,
							city: req.body.city,
							street: req.body.street,
							house: req.body.house,
							room: req.body.room,
							full_name: full_name
						}, (err, result) => {
							if (err) {
								throw err;
							}
							bd.connection.queryRow(
								'SELECT idlocation FROM location WHERE _index = "' + req.body.index + '" and street = "' + req.body.street + '"',
								(err, result) => {
									res.send({value: result.idlocation, text: full_name});
								}
							)
						}
					)
				}
			}
		}
	});
	
});

module.exports = router;
