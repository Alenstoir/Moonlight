var log = require('../../mods/log')(module);
var createError = require('http-errors');
var bd = require('../../mods/bd');
var crypto = require('crypto');
var async = require('async');

class Kurs  {
	id = "";
	title = "";
    theme = "";
    type = "";
    longing = "";
    status = "";
    announse = "";
    start = "";
    end = "";
    results = "";
    responsible = "";
    curator = "";
    location = "";
    max_group = "";
    cost = "";
    acc_num = "";
    contract_num = "";
    notes = "";

	load = async function(id, callback) {
		let promise = new Promise(resolve => { bd.connection.queryRow(
			'SELECT * FROM kurs_instance WHERE id = "' + id + '"',
			(err, result) => resolve({err, result}))});
		let result = await promise;
		if (result.err) {
			throw result.err;
		};
		this.id = result.result.id;
		this.title = result.result.title;
		this.type = result.result.type;
	    this.theme = result.result.theme;
	    this.longing = result.result.longing;
	    this.status = result.result.status;
	    //this.announse = result.result.announse;
	    //this.start = result.result.start;
	    //this.end = result.result.end;
	    //this.results = result.result.results;
	    this.responsible = result.result.responsible;
	    this.curator = result.result.curator;
	    this.location = result.result.location;
	    this.max_group = result.result.max_group;
	    this.cost = result.result.cost;
	    this.acc_num = result.result.acc_num;
	    this.contract_num = result.result.contract_num;
	    this.notes = result.result.notes;

	    //this.announse = new Date(result.result.announse.getFullYear(), result.result.announse.getMonth(), result.result.announse.getDate());
	    if (result.result.announse != null) {
	    	this.announse = "" + redDate(result.result.announse.getFullYear()) + "-" + redDate((result.result.announse.getMonth()+1)) + "-" + redDate(result.result.announse.getDate());
	    }
	    if (result.result.start != null) {
	    	this.start = "" + redDate(result.result.start.getFullYear()) + "-" + redDate((result.result.start.getMonth()+1)) + "-" + redDate(result.result.start.getDate());
	    }
	    if (result.result.end != null) {
	    	this.end = "" + redDate(result.result.end.getFullYear()) + "-" + redDate((result.result.end.getMonth()+1)) + "-" + redDate(result.result.end.getDate());
	    }
	    if (result.result.results != null) {
	    	this.results = "" + redDate(result.result.results.getFullYear()) + "-" + redDate((result.result.results.getMonth()+1)) + "-" + redDate(result.result.results.getDate());
	    }

		log.debug("Loaded kurs info: " + this.id);
		callback(result.err);
		function redDate(i){
			return (i < 10) ? "0" + i : "" + i;
		}
	};

	save = async function(callback) {
		let promise = new Promise(resolve => { bd.connection.update(
			'kurs_instance',
			{
				title: this.title,
				theme: this.theme,
				type: this.type,
				longing: this.longing,
				status: 0,
				start: this.start,
				end: this.end,
				results: this.results,
				responsible: this.responsible,
				curator: this.curator,
				location: this.location,
				max_group: this.max_group,
				cost: this.cost,
				acc_num: this.acc_num,
				contract_num: this.contract_num,
				notes: this.notes
			}, {
				id: this.id
			}, (err, result) => resolve({err, result}))});
		let result = await promise;
		if (result.err) {
			throw result.err;
		};
		log.debug("Updated  kurs info: " + this.id);
		callback(result.err);
	};
	
	create = async function(theme, type, title, longing, start, end, results, responsible, curator, location, max_group, cost, acc_num, contract_num, notes, callback) {
		this.title = title;
	    this.theme = theme;
	    this.type = type;
	    this.longing = longing;
	    this.start = start;
	    this.end = end;
	    this.results = results;
	    this.responsible = responsible;
	    this.curator = curator;
	    this.location = location;
	    this.max_group = max_group;
	    this.cost = cost;
	    this.acc_num = acc_num;
	    this.contract_num = contract_num;
	    this.notes = notes;

	    console.log(this);
		let promise = new Promise(resolve => { bd.connection.insert(
			'kurs_instance', {
				title: this.title,
				theme: this.theme,
				type: this.type,
				longing: this.longing,
				status: 1,
				start: this.start,
				end: this.end,
				results: this.results,
				responsible: this.responsible,
				curator: this.curator,
				location: this.location,
				max_group: this.max_group,
				cost: this.cost,
				acc_num: this.acc_num,
				contract_num: this.contract_num,
				notes: this.notes
			},
			(err, result) => resolve({err, result})
		)});
		let result = await promise;
		log.debug("Created kurs info: " + this.id);
		callback(result.err, result.result);
	};

	getRaw = function(){
		var raw = {
			id: this.id,
			title: this.title,
			type: this.type,
   			theme: this.theme,
    		longing: this.longing,
    		status: this.status,
    		announse: this.announse,
   			start: this.start,
    		end: this.end,
    		results: this.results,
    		responsible: this.responsible,
    		curator: this.curator,
    		location: this.location,
    		max_group: this.max_group,
    		cost: this.cost,
    		acc_num: this.acc_num,
    		contract_num: this.contract_num,
    		notes: this.notes
		};
		return raw;
	}
	getWhole = async function(id, callback){
		var whole = {
			id: this.id,
			title: this.title,
   			theme: this.theme,
			type: this.type,
    		longing: this.longing,
    		status: this.status,
    		announse: this.announse,
   			start: this.start,
    		end: this.end,
    		results: this.results,
    		responsible: this.responsible,
    		curator: this.curator,
    		location: this.location,
    		max_group: this.max_group,
    		cost: this.cost,
    		acc_num: this.acc_num,
    		contract_num: this.contract_num,
    		notes: this.notes
		};
		let promise = new Promise(resolve => { extendKurs(whole, id, (err, result) => resolve({err, result}))});
		var back = await promise;
		callback(back.err, back.result);
}
}
var extendKurs = function(result, id, callback){
	async.parallel(
		[
			function(callback){
				bd.connection.queryHash(
				'SELECT user.id, user.fio FROM user, kurs_leaders_dictionary WHERE kurs_instance_id = "' + result.id + '" and user.id = leads_id',
				(err, read) => {
					result = Object.assign(result, {leads:read});
					callback(null);
				})
			},
			function(callback){
				bd.connection.queryHash(
				'SELECT * FROM listeners_dictionary WHERE id_kurs = "' + result.id + '" and id_people = "' + id + '"',
				(err, read) => {
					if (Object.keys(read).length > 0) {
						result = Object.assign(result, {enroll:true});
					}
					callback(null);
				})
			},
			function(callback){
				bd.connection.queryHash(
				'SELECT user.id, user.fio FROM user, kurs_accreditation_dictionary WHERE kurs_instance_id = "' + result.id + '" and user.id = leads_id',
				(err, read) => {
					result = Object.assign(result, {accreditation:read});
					callback(null);
				})
			},
			function(callback){
				bd.connection.queryHash(
				'SELECT * FROM location WHERE idlocation = "' + result.location + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item].city + ", " + read[item].street + ", " + read[item].house;
					}
					result.location = read;
					callback(null);
				})
			},
			function(callback){
				bd.connection.queryHash(
				'SELECT user.fio FROM user WHERE id = "' + result.responsible + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item];
					}
					result.responsible = read.fio;
					callback(null);
				})
			},
			function(callback){
				bd.connection.queryHash(
				'SELECT name FROM kurs_dictionary WHERE id = "' + result.theme + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item];
					}
					result.theme = read.name;
					callback(null);
				})
			},
			function(callback){
				bd.connection.queryHash(
				'SELECT user.fio FROM user WHERE id = "' + result.curator + '"',
				(err, read) => {
					for (let item in read) {
						read = read[item];
					}
					result.curator = read.fio;
					callback(null);
				})
			}
		], 
	(err) => {
		callback(err, result);
	});
	}





module.exports = Kurs;