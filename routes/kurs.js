var log = require('../mods/log')(module);
var createError = require('http-errors');
var formidable = require('formidable');
var users = require('../mods/user');
var vars = require('../mods/vars');
var Kurs = require('../mods/kurs');
var docs = require('../mods/docs');
var express = require('express');
var bd = require('../mods/bd');
var router = express.Router();
var async = require('async');
var fs = require('fs');

/* GET users listing. */

if(module.parent){
	log.debug("Connected kurs router");
}

router.get('/', function(req, res, next) {
	var user = new users;
	console.log(req.session.login);
	user.load(req.session.login, (err, result) => {
		console.log(err);
		if (err) {
			next(err)
		} else if (result) {
			res.locals.level = user.level;
	  		res.render('index', { title: 'Moonlight', currentUser: req.session.login, userPic: user.userIco, click: '/kurs'});
		} else {
  			res.render('indexBlank', { title: 'Moonlight'});
		}
	});
	
});	

router.post('/', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next(err);
		}
		res.locals.level = user.level;
		res.render("kurs", {mode: user.level});
	});
	
});	





router.post('/:type', function(req, res, next) {
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next(err);
		}
		res.locals.level = user.level;
		switch(req.params.type){
			case 'render': {
					if (user.level == 3) {
						bd.connection.queryHash(
							'SELECT id_kurs FROM user, listeners_dictionary WHERE user.id = "' + user.id + '" and id_people = user.id',
								(err, result) => {
								var matched = [];
								if (err) {
									throw err;
								} else {
									for(key in result){
										matched.push(key);
									}
									var opts = req.body.all ? {} : {'kurs_instance.id': '('+matched+')'};
									opts = bd.connection.where(opts);
									if (!req.body.all) {
										opts = "WHERE " + opts;
									}
									
									bd.connection.queryHash(
										'SELECT kurs_instance.id, type, status, title, theme, longing, start, end, kurs_instance.location, max_group, cost '+
										'FROM moonlight.kurs_instance, kurs_dictionary '+ opts +';',
										(err, result) => {
											if (err) {
												throw err;
											} else {
												async.eachSeries(result, (item, callback) =>{
													parallelRender(user, result, item, callback);
												}, (err) => {
													if (err) {
														throw err;
													} else {
														res.render("kurs_block",{result:result, mode:'none'});
													}
												});
											}
										}
									)
								}
							}
						)
					} else  if (user.level == 2) {
						bd.connection.queryHash(
							'SELECT kurs_instance_id FROM user, kurs_leaders_dictionary WHERE user.id = "' + user.id + '" and user.id = kurs_leaders_dictionary.leads_id ' +
							'UNION SELECT kurs_instance_id FROM user, kurs_accreditation_dictionary WHERE user.id = "' + user.id + '" and user.id = kurs_accreditation_dictionary.leads_id ' +
							'UNION SELECT id as kurs_instance_id FROM kurs_instance WHERE curator = "' + user.id + '"',
								(err, result) => {
								var matched = [];
								if (err) {
									throw err;
								} else {
									for(key in result){
										matched.push(key);
									}
									var opts = req.body.all ? {} : {'kurs_instance.id': '('+matched+')'};
									opts = bd.connection.where(opts);
									if (!req.body.all) {
										opts = "WHERE " + opts;
									}
									bd.connection.queryHash(
										'SELECT kurs_instance.id, type, status, title, theme, longing, start, end, kurs_instance.location, max_group, cost '+
										'FROM moonlight.kurs_instance, kurs_dictionary '+ opts +';',
										(err, result) => {
											if (err) {
												throw err;
											} else {
												async.eachSeries(result, (item, callback) =>{
													parallelRender(user, result, item, callback);
												}, (err) => {
													if (err) {
														throw err;
													} else {
														res.render("kurs_block",{result:result, mode: user.level});
													}
												});
											}
										}
									)
								}
							}
						)			
					} else  if (user.level <= 1) {
						bd.connection.queryHash(
							'SELECT kurs_instance.id, type, status, title, theme, longing, start, end, kurs_instance.location, max_group, cost FROM `moonlight`.`kurs_instance`',
							(err, result) => {
								if (err) {
									throw err;
								} else {
									async.eachSeries(result, (item, callback) =>{
										parallelRender(user, result, item, callback);
									},function(err){
										if (err) {
											throw err;
										} else {
											res.render("kurs_block",{result:result, mode:'admin'});
										}
									});
									
								}
							}
						)			
					}
				break;
			}
			case 'getLocations' : {
				bd.connection.queryHash(
					'SELECT * FROM location',
					(err, result) => {
						console.log(req.body.id);
						res.render("partials/kurs/data_locations", {result:result, location: req.body.id});	
					}
				)
				break;
			}
			case 'getLeads' : {
				bd.connection.queryHash(
					'SELECT * FROM kurs_leaders_dictionary WHERE kurs_instance_id ="' + req.body.id + '"',
					(err, result) => {
						var leads = [];
						for(key in result){
							leads.push(result[key].leads_id);
						}
						bd.connection.queryHash(
							'SELECT id, fio FROM user WHERE level = 2',
							(err, result) => {
								res.render("partials/kurs/leads_options", {result:leads, preps: result});					
							}
						)
					}
				)
				break;
			}
			case 'listeners': {
				if (user.level <=2) {
					bd.connection.queryHash(
						'SELECT fio, login, email, phone FROM user, listeners_dictionary WHERE user.id = id_people and id_kurs = "' + req.body.id + '"',
						(err, result) => {
							bd.connection.queryHash(
								'SELECT id as kurs_instance_id FROM kurs_instance WHERE responsible ="' + user.id + '"' +
								'UNION SELECT id as kurs_instance_id FROM kurs_instance WHERE curator = "' + user.id + '"',
								(err, access) => {
									var matched = [];
									if (err) {
										throw err;
									} else {
										for(key in access){
											matched.push(key);
										}
										let editable = (matched.includes(req.body.id)) ? true : false;
										if (user.level == 0) { editable = true; }
										res.render("users", {user: result, editable: editable, kurs: req.body.id});
									}
								}
							);
						}
					)
				} else {
					res.next(createError(403, "Forbidden"));
				}
				break;
			}
			case 'info': {
				var kurs = new Kurs;
				kurs.load(req.body.id, (err) => {
					kurs.getWhole(user.id, (err, resolve) => {
						switch(user.level) {
							case 0: {

							}
							case 1: {

							}
							case 2: {
								bd.connection.queryHash(
								'SELECT kurs_instance_id FROM user, kurs_leaders_dictionary WHERE user.id = "' + user.id + '" and user.id = kurs_leaders_dictionary.leads_id ' +
								'UNION SELECT kurs_instance_id FROM user, kurs_accreditation_dictionary WHERE user.id = "' + user.id + '" and user.id = kurs_accreditation_dictionary.leads_id ' +
								'UNION SELECT id as kurs_instance_id FROM kurs_instance WHERE curator = "' + user.id + '" ' +
								'UNION SELECT id as kurs_instance_id FROM kurs_instance WHERE responsible = "' + user.id + '"',
								(err, read) => {
									if (Object.keys(read).length > 0) {
										res.render("partials/kurs/kurs_info", {result: resolve, edu:true});
									} else if (user.level == 0) {
										res.render("partials/kurs/kurs_info", {result: resolve, edu:true});							
									} else {
										res.render("partials/kurs/kurs_info", {result: resolve, edu:false});	
									}
								})
								break;
							}
							case 3: {
								bd.connection.queryHash(
								'SELECT * FROM listeners_dictionary WHERE id_kurs = "' + kurs.id + '" and id_people = "' + user.id + '"',
								(err, read) => {
									delete resolve['acc_num'];
									delete resolve['contract_num'];
									delete resolve['notes'];
									delete resolve['accreditation'];
									delete resolve['announse'];
									delete resolve['results'];
									if (Object.keys(read).length > 0) {
										res.render("partials/kurs/kurs_info", {result: resolve, enroll:true});
									} else {
										res.render("partials/kurs/kurs_info", {result: resolve, enroll:false});								
									}
								})
								break;
							}
						}
						
					})
				});
				break;
			}
			case 'manage': {
				bd.connection.queryHash(
					'SELECT id as kurs_instance_id FROM kurs_instance WHERE responsible ="' + user.id + '"' +
					'UNION SELECT id as kurs_instance_id FROM kurs_instance WHERE curator = "' + user.id + '"',
					(err, result) => {
						var matched = [];
						if (err) {
							throw err;
						} else {
							for(key in result){
								matched.push(key);
							}
							var kurs = new Kurs;
							kurs.load(req.body.id, (err) => {
								loadKurs(res,
								(err) => {
									let editable = (matched.includes(kurs.id)) ? true : false;
									if (user.level == 0) { editable = true; }
									res.render("partials/kurs/kurs_edit", {result:kurs.getRaw(), editable: editable});
								});
							})
						}
					}
				);
						
						/*
						var opts = req.body.kurs_id ? {} : {'kurs_instance.id': '('+req.body.id+')'};
						opts = bd.connection.where(opts);
						if (!req.body.all) {
							opts = "WHERE " + opts;
						}
						bd.connection.queryHash(
							'SELECT * FROM `moonlight`.`kurs_instance` ' + opts + ';',
							(err, result) => {
								if (err) {
									throw err;
								} else {
									async.eachSeries(result, (item, callback) =>{
										parallelRender(user, result, item, callback);
									},function(err){
										if (err) {
											throw err;
										} else {
											
										}
									});
									
								}
							}
						)*/
				break;
			}
			case 'edit': {
				loadKurs(res,
				(err) => {
					res.render("partials/kurs/kurs_edit");
				});
				break;
			}
			case 'getListenerDay': {
				//console.log(req.body.id);
				//console.log(req.body.kurs);
				//console.log(req.body.date);
				//console.log();
				bd.connection.queryRow(
					'SELECT * FROM lesson_data WHERE user_id = "' + req.body.id + '" and lesson_instance = "' + req.body.id_kurs + '"',
					(err, result) => {
						if (result == false) {
							result = {
								user_id:req.body.id,
								lesson_instance: req.body.id_kurs,
								presense: 0,
								mark: null,
								note: null
							}
						}
						res.render("partials/kurs/leads_popup", {result: result});
					}
				)
				break;
			}
			case 'loadLessonFile' : {
				new formidable.IncomingForm().parse(req)
					.on('fileBegin', (name, file) => {
				        file.path = './uploads/' + file.name
				    })
				    .on('file', (name, file) => {
				     	log.info('Uploaded file ' + file.name + ' from ' + user.login + ' as lesson resource');
				     		bd.connection.update(
				     			'lesson_instance',
				     			{ path: file.path = './uploads/' + file.name },
				     			{ path: req.session.nextPath },
				     			(err, result) => {
									res.send(true);
				     			}
				     		)
						});
				break;
			}
			case 'createDay' : {
						console.log(req.body);
				if (user.level <= 2) {
					if (req.body.path) {
						bd.connection.queryRow(
							'SELECT path FROM kurs_instance, kurs_dictionary WHERE kurs_dictionary.id = kurs_instance.theme and kurs_instance.id = "' + req.body.id_kurs + '"',
							(err, result) => {
								req.session.nextPath = './uploads/' ;
								bd.connection.insert(
									'lesson_instance',
									{
										id_kurs: req.body.id_kurs,
										path: req.session.nextPath
									},
									(err, result) => {
										res.end();	
									}
								)
							}
						)
					} else {
						bd.connection.insert(
							'lesson_instance',
							{
								id_kurs: req.body.id_kurs
							},
							(err, result) => {
								res.end();
							}
						)
					}
				}
				break;
			}
			case 'getFiles' : {
				bd.connection.queryHash(
					'SELECT path FROM lesson_instance WHERE path is not null and id_kurs = "' + req.body.id + '"',
					(err, result) => {
						res.render("filesTable", {result});
					}
				)
				break;
			}
			case 'updateData' : {
				if (req.body.mark == '' || req.body.mark == 'null') {
					req.body.mark = null;
				}
				if (req.body.note == '') {
					req.body.note = null;
				}
				if (req.body.presense == '') {
					req.body.presense = null;
				}
				bd.connection.update(
					'lesson_data',
					{ 
						presense: req.body.presense,
						mark: req.body.mark,
						note: req.body.note
					},
					{ 
						user_id: req.body.id,
						lesson_instance: req.body.id_kurs
					},
					(err, result) => {
						if (!result) {
							bd.connection.insert(
								'lesson_data',
								{ 
									user_id: req.body.id,
									lesson_instance: req.body.id_kurs,
									presense: req.body.presense,
									mark: req.body.mark,
									note: req.body.note
								},
								(err, result) => {
									res.send({result});
								}
							)
						} else {
							res.send({result});
						}
					}
				)
				break;
			}
			case 'edu': {
				if (user.level <= 2) {
					bd.connection.queryHash(
						'SELECT * FROM lesson_instance WHERE id_kurs = "' + req.body.id + '";',
						(err, result) => {
							async.parallel([
								function(callback) {
									async.eachSeries(result, (item, callback) => {
										bd.connection.queryHash(
											'SELECT user_id, fio, presense, mark FROM moonlight.lesson_data, user WHERE user_id = user.id and lesson_instance = "' + item.id + '"',
											(err, lesson) => {
												//console.log(result[item.id]);
												result[item.id].data = lesson;
												callback(null);
											}
										)
									}, (err) => {
										callback(null, result);
										//console.log("each done");
									})
									
								},
								function(callback) {
									bd.connection.queryHash(
										'SELECT user.id, fio FROM user, listeners_dictionary WHERE id_kurs = "' + req.body.id + '" and id_people = user.id',
										(err, listeners) => {
											//console.log("dates done");
											callback(null, listeners);
										}
									)
								},
								function(callback) {
									bd.connection.queryRow(
										'SELECT title FROM kurs_instance WHERE id = "' + req.body.id + '"',
										(err, title) => {
											callback(null, title);
										}
									)
								}
								], (err, results) => {
									//console.log(results);
									bd.connection.queryHash(
										'SELECT id as kurs_instance_id FROM kurs_instance WHERE responsible ="' + user.id + '" ' +
										'UNION SELECT kurs_instance_id FROM kurs_leaders_dictionary WHERE leads_id = "' + user.id + '" ' +
										'UNION SELECT id as kurs_instance_id FROM kurs_instance WHERE curator = "' + user.id + '"',
										(err, access) => {
											var matched = [];
											if (err) {
												throw err;
											} else {
												for(key in access){
													matched.push(key);
												}
												let editable = (matched.includes(req.body.id)) ? true : false;
												if (user.level == 0) { editable = true; }
												res.render("partials/kurs/leads_board", {editable: editable, listeners: results[1], data: results[0], kurs:req.body.id, title: results[2] });
											}
										}
									);
									//console.log(results[0]);
								}
							)
						}
					)				
				}
				break;
			}
			case 'enroll': {
				bd.connection.queryRow(
				'SELECT * FROM listeners_dictionary WHERE id_people = "' + user.id + '" and id_kurs = "' + req.body.id + '"',
				(err, result) => {
					if (err) { throw err; }
					if (result) {
						bd.connection.delete(
							'listeners_dictionary',
							{
								id_people: user.id,
								id_kurs: req.body.id
							},
							(err, result) => {
								if (err) { throw err; }
								res.send(null);						
							}
						)						
					} else {
						bd.connection.insert(
							'listeners_dictionary',
							{
								id_people: user.id,
								id_kurs: req.body.id
							},
							(err, result) => {
								if (err) { throw err; }
								res.send(null);
							}
						)
					}
				})
				break;
			}
			case 'close' : {
				var kurs = new Kurs;
				kurs.load(req.body.id, (err) => {
					bd.connection.queryRow(
						'SELECT * FROM kurs_dictionary WHERE id = "' + kurs.theme + '"',
						(err, dictionary) => {
							bd.connection.update(
								'kurs_instance',
								{ status: 0 },
								{ id: req.body.id },
								(err, result) => {
									bd.connection.queryHash(
										'SELECT * FROM listeners_dictionary WHERE id_kurs = "' + req.body.id + '"',
										(err, result) => {
											doc = new docs();
											doc.path = 'uploads/regBook.xlsx';
											doc.load();
											var lastNum = parseInt(doc.getLastNum(0).reg);
											var lastRow = parseInt(doc.getLastNum(0).row)+1;
											console.log(lastNum + ' ' + lastRow);

											for (item in result) {
												async.eachSeries(result, (item, callback) =>{
														bd.connection.queryRow(
															'SELECT fio FROM user WHERE id = "' + item.id_people + '"',
															(err, fio) => {
																console.log('stage');
																console.log(fio);
																lastNum = lastNum + 1;
																lastRow = lastRow + 1;
																doc.giveReg(0, lastRow, 3, lastNum.toString());
																doc.giveReg(0, lastRow, 4, kurs.id.toString());
																if (kurs.type) {
																	doc.giveReg(0, lastRow, 5, 'Профессиональная подготовка');
																} else {
																	doc.giveReg(0, lastRow, 5, 'Повышение квалификации');
																}
																doc.giveReg(0, lastRow, 6, fio.fio);
																doc.giveReg(0, lastRow, 7, dictionary.sub_field1);
																doc.giveReg(0, lastRow, 8, dictionary.sub_field2);
																doc.giveReg(0, lastRow, 9, dictionary.sub_field3);
																callback(null);
															}
														)
													}, (err) => {
														doc.save((err, stats) => {
															console.log(stats);
															res.send('/file/' + doc.path);
														});
													});
											}
										}
									)
								}
							)
						}
					)
				}) //k-end

				
				break;
			}
			case 'confExclude': {
				bd.connection.queryRow(
					'SELECT id FROM user WHERE login = "' + req.body.login + '"',
					(err, result) => {
						bd.connection.delete(
							'listeners_dictionary',
							{ 
								id_kurs: req.body.kurs,
								id_people: result.id
							},
							(err, result) => {
								res.send(true);
							}
						)
					}
				)
				
				break;
			}
			case 'exclude': {
				console.log(req.body);
				var target = new users();
				target.load(req.body.login, (err, result) => {
					var kurs = new Kurs;
					kurs.load(req.body.kurs, (err) => {
						bd.connection.queryRow(
							'SELECT fio FROM user WHERE id = "' + user.related_org + '"',
							(err, result) => {
								user.related_org = result.fio;
								var doc = new docs();
								doc.create('uploads/' + kurs.id + '_' + user.id + '_' + target.id, 'docx');
								doc.createStatement(req.body.lead_place , user.related_org, req.body.director_name, req.body.user_place, user.fio, target.fio, kurs.id, kurs.title, req.body.reason, (err) => {
									res.send('uploads/' + kurs.id + '_' + user.id + '_' + target.id + '.docx');
								})
							}
						) 
					})
				})
				break;
			}
			case 'create': {
				loadKurs(res,
				(err) => {
					res.render("partials/kurs/kurs_create");
				});
				break;
			}
			case 'create_theme': {
				res.render("partials/kurs/theme_create");
				break;
			}
			case 'confirm_creation': {
				var kurs = new Kurs; 
				
				kurs.create(req.body.theme, req.body.type, req.body.title, req.body.longing, req.body.start, req.body.end, null, req.body.org, req.body.curator, req.body.location, req.body.max_group, req.body.cost, req.body.acc_num, req.body.contract_num, req.body.notes,
				(err, result) => {
					console.log(err, result);
					bd.connection.queryRow(
						'SELECT id FROM kurs_instance WHERE title = "' + req.body.title + '" and start = "' + req.body.start + '" and end = "' + req.body.end + '" and responsible = "' + req.body.org + '"',
						(err, k_id) => {
							console.log("wtf");
							console.log(k_id);
							async.eachSeries(req.body.leads, (item, callback) =>{
								bd.connection.insert(
									'kurs_leaders_dictionary',
									{ 
										kurs_instance_id: k_id.id,
										leads_id: item
									},
									(err, result) => {
										console.log(err, result);
										console.log('wtfagain');
										callback(null);
									}
								)
							}, (err) => {
								console.log("kekw");
								console.log(err);
			  					req.session.nextClick = '/kurs';
			  					res.render('index', { title: 'Moonlight', currentUser: req.session.login, userPic: user.userIco, redir: '1'});
							})
						}
					)
					
				});
				break;
			} 
			case 'confirm_theme': {
				let theme_path = './uploads/' + req.body.title + '_' + new Date().getTime();
				bd.connection.insert(
					'kurs_dictionary',
					{
						name: req.body.title,
						description: req.body.desc,
						path: theme_path,
						actual: 1,
						sub_field1: req.body.prof_name,
						sub_field2: req.body.sphere,
						sub_field3: req.body.speciality
					},
					(err, result) => {
  						req.session.nextClick = '/kurs';
  						res.render('index', { title: 'Moonlight', currentUser: req.session.login, userPic: user.userIco, redir: '1'});
  						fs.mkdirSync(theme_path, { recursive: true });
					}
				)
				break;
			} 
			default: {
				log.error("No such type: " + req.params.type);
			}
		}
	});
});

router.post('/:id', function(req, res, next) {
	bd.connection.queryRow(
		'SELECT * FROM user WHERE id = ' + req.params.id,
		(err, result) => {
			if (err) {
				throw err;
			} else {
				if (!result) {
					next(createError(500, "User not found"));
				} else {
					res.json(result);					
				}
			}
		}
	)
});

//--------------------------------------------------------------------------------------------------------------------------------------------------------//


module.exports = router;


//--------------------------------------------------------------------------------------------------------------------------------------------------------//

var loadKurs = function(res, callback){
	async.parallel([
					function(callback){
						bd.connection.queryHash(
							'SELECT * FROM kurs_dictionary',
							(err, result) => {
								//console.log("Темы");
								//console.log(result);
								res.locals.themes = result;
								callback(err);
							}
						)
					},
					function(callback){
						bd.connection.queryHash(
							'SELECT id, fio FROM user WHERE level = 1',
							(err, result) => {
								//console.log("Организаторы");
								//console.log(result);
								res.locals.orgs = result;
								callback(err);
							}
						)
					},
					function(callback){
						bd.connection.queryHash(
							'SELECT id, fio FROM user WHERE level = 2',
							(err, result) => {
								//console.log("Кураторы");
								//console.log(result);
								res.locals.preps = result;
								callback(err);
							}
						)
					},
					function(callback){
						bd.connection.queryHash(
							'SELECT * FROM location',
							(err, result) => {
								//console.log("Место проведения");
								//console.log(result);
								res.locals.locations = result;
								callback(err);
							}
						)
					}
				], callback)
}

var parallelRender = function(user, result, item, callback){
	async.parallel(
		[
			/*function(callback){
				bd.connection.queryHash(
				'SELECT user.id, user.fio FROM user, kurs_leaders_dictionary WHERE kurs_instance_id = "' + item.id + '" and user.id = leads_id',
				(err, read) => {
					result[item.id] = Object.assign(result[item.id], {leads:read});
					callback(null);
				})
			},*/
			function(callback){
				bd.connection.queryHash(
				'SELECT * FROM listeners_dictionary WHERE id_kurs = "' + item.id + '" and id_people = "' + user.id + '"',
				(err, read) => {
					if (Object.keys(read).length > 0) {
						result[item.id] = Object.assign(result[item.id], {enroll:true});
					}
					callback(null);
				})
			},/*
			function(callback){
				bd.connection.queryHash(
				'SELECT user.id, user.fio FROM user, kurs_accreditation_dictionary WHERE kurs_instance_id = "' + item.id + '" and user.id = leads_id',
				(err, read) => {
					result[item.id] = Object.assign(result[item.id], {accreditation:read});
					callback(null);
				})
			},*/
			function(callback){
				bd.connection.queryHash(
				'SELECT * FROM location WHERE idlocation = "' + item.location + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item].city + ", " + read[item].street + ", " + read[item].house;
					}
					result[item.id].location = read;
					callback(null);
				})
			},/*
			function(callback){
				bd.connection.queryHash(
				'SELECT user.fio FROM user WHERE id = "' + result[item.id].responsible + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item];
					}
					result[item.id].responsible = read.fio;
					callback(null);
				})
			},*/
			function(callback){
				bd.connection.queryHash(
				'SELECT name, sub_field1, sub_field2, sub_field3  FROM kurs_dictionary WHERE id = "' + result[item.id].theme + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item];
					}
					result[item.id].theme = read.name;
					result[item.id].prof_name = read.sub_field1;
					result[item.id].sphere = read.sub_field2;
					result[item.id].speciality = read.sub_field3;
					callback(null);
				})
			},/*
			function(callback){
				bd.connection.queryHash(
				'SELECT user.fio FROM user WHERE id = "' + result[item.id].curator + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item];
					}
					result[item.id].curator = read.fio;
					callback(null);
				})
			}*/
		], 
	callback);
}