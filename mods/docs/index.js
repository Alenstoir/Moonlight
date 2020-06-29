var log = require('../../mods/log')(module);
var createError = require('http-errors');
const officegen = require('officegen')
var bd = require('../../mods/bd');
var crypto = require('crypto');
var xlsx = require('node-xlsx');
var xl = require('excel4node');
var async = require('async');
const fs = require('fs')

 
class Doc {
	path = 'uploads/xfile.xlsx';
	type = '';
	wb = '';
	ws = [];
	wSheets = '';
	length = '';

	create = function(path, type) {
		this.path = path;
		this.type = type;
		if (type == 'xlx') {
			this.wb = new xl.Workbook();
			this.ws[0] = this.wb.addWorksheet('Лист 1');
			this.length = 1;
		} else if (type == 'docx') {
			this.path = this.path + '.docx'
			console.log(this.path);
		}
	}

	insert = function(page, col, data, last) {
		this.ws[page].cell(this.length, col).string(data);
		if (last) {
			this.length++;
		}
		//console.log('inserted');
		console.log(this.ws[page]);

	}

	getRegNum = function(book, num) {
		for(let row in this.wSheets[book].data){
			if (this.wSheets[book].data[row][2] != undefined) {
				if (this.wSheets[book].data[row][2] == num) {
					return { series: this.wSheets[book].data[row][0], number: this.wSheets[book].data[row][1], reg: this.wSheets[book].data[row][2] };
				}
			}
		}
	}

	getLastNum = function(book) {
		var last = '';
		for(let row in this.wSheets[book].data){
				console.log(this.wSheets[book].data[row][2]);
			if (this.wSheets[book].data[row][2] != undefined) {
				last = { row: row, series: this.wSheets[book].data[row][0], number: this.wSheets[book].data[row][1], reg: this.wSheets[book].data[row][2] }; 
			}
		}
		console.log(last);
		return last;
	}

	giveReg = function(page, row, cell, data) {
		this.ws[page].cell(row, cell).string(data);
	}

	getAllRegs = function(book) {
		var arr = [];
		for(let row in this.wSheets[book].data){
			if (this.wSheets[book].data[row][2] != undefined) {
				if (row == 0) { continue }
				arr.push({ series: this.wSheets[book].data[row][0], number: this.wSheets[book].data[row][1], reg: this.wSheets[book].data[row][2] });
			}
		}
		return arr;
	}

	save = function(callback){
		this.wb.write(this.path, (err, stats) => {
			callback(err, stats);
		})
	}

	load = function(){
		this.wSheets = xlsx.parse(this.path);
		this.wb = new xl.Workbook();
		for(let item in this.wSheets) {
			this.ws[item] = this.wb.addWorksheet(this.wSheets[item].name);
			for(let row in this.wSheets[item].data){
				for(let col in this.wSheets[item].data[row]) {
					this.ws[item].cell((parseInt(row)+1), (parseInt(col)+1)).string(this.wSheets[item].data[row][col]);
				}
				this.length = parseInt(row)+2;
			}
		}

	}

	toArray = function(){
		var arr = [];
		for(let item in this.wSheets) {
		console.log(this.wSheets[item]);
			this.ws[item] = this.wb.addWorksheet(this.wSheets[item].name);
			for(let row in this.wSheets[item].data){
				var subArr = [];
				if (row == 0) { continue }
				for(let col in this.wSheets[item].data[row]) {
					subArr[this.wSheets[item].data[0][col]] = (this.wSheets[item].data[row][col]);
				}
				arr.push(subArr);
				subArr = [];
			}
		console.log(this.wSheets[item]);
		}
		return arr;
	}
	createStatement = function(lead_place ,company_name, director_name, user_place, user_fio, target_fio, kurs_id, kurs_name, reason, callback) {
		let regText = { font_face: 'Arial', font_size: 12 };
		let noticeText = { font_face: 'Arial', font_size: 14 };
		// Create an empty Word object:

		let docx = officegen({
			type: this.type,
			pageMargins:{ top: 480, right: 480, bottom: 480, left: 1440 }
		})

			 
		// Officegen calling this function after finishing to generate the docx document:
		docx.on('finalize', function(written) {
			callback(null);
			console.log(
		    	'Finish to create a Microsoft Word document.'
		  	)
		})
		 
		// Officegen calling this function to report errors:
		docx.on('error', function(err) {
		  console.log(err)
		})
		let date = new Date();
		let pObj = docx.createP()
		pObj.options.align = 'right' 
		pObj.addText( lead_place + ' ' + company_name, regText);
		pObj.addLineBreak();
		pObj.addText('' + director_name, regText);
		pObj.addLineBreak();
		pObj.addText('От ' + user_place, regText);
		pObj.addLineBreak();
		pObj.addText('' + user_fio, regText);
		pObj.addLineBreak();
		pObj.addLineBreak();

		pObj = docx.createP({ align: 'center' })
		pObj.addText('Служебная записка',  noticeText);
		 
		pObj = docx.createP({ align: 'justify' })
		pObj.addText('Прошу отчислить ' + target_fio + ' с курса №' + kurs_id + ' : "' + kurs_name + '" по причине "' + reason + '"', regText);
		 
		pObj = docx.createP()
		pObj.addText('' + user_place, regText);
		pObj.addLineBreak();
		pObj.addText('' + user_fio, regText);
		pObj.addLineBreak();
		pObj.addLineBreak();
		pObj.addLineBreak();
		pObj = docx.createP( { textAlignment: 'bottom'})
		pObj.addText( date.getDate() + '.' + redDate(date.getMonth()+1) + '.' + date.getFullYear() + ' г.', regText);
		pObj = docx.createP({ textAlignment: 'top'})
		pObj.options.align = 'right' ;
		pObj.addText('Подпись : ________________', regText);

		// Let's generate the Word document into a file:
		 console.log(this.path);
		let out = fs.createWriteStream(this.path)
		 
		out.on('error', function(err) {
		  console.log(err)
		})
		 
		// Async call to generate the output file:
		docx.generate(out);
	}
}

//var doc = new Doc();
// doc.create('uploads/docfile.docx', 'docx');
// //doc.load();
// //console.log(doc.getAllRegs(0))
//  doc.insert( 0, 1, 'ПРТ117701', false);
//  doc.insert( 0, 2, '000008', false);
//  doc.insert( 0, 3, '1', true);
//  doc.insert( 0, 1, 'ПРТ117701', false);
//  doc.insert( 0, 2, '000009', true);
// //console.log(doc.toArray());
// doc.save();

//doc.createStatement('название компании', 'название директора', 'должность лица', 'само лицо', 'цель', 'курсИД', 'название курса', 'какая-то ну писец ну очень ебат длинная причина шо писос', (err) => {
//	console.log('end');
//});

module.exports = Doc;

function redDate(i){
	return (i < 10) ? "0" + i : "" + i;
}
