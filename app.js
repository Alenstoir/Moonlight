var cookieParser = require('cookie-parser');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dataRouter = require('./routes/dadata');
var fileRouter = require('./routes/files');
var saveRouter = require('./routes/save');
var kursRouter = require('./routes/kurs');
var session = require('express-session');
var SQLstore = require('express-mysql-session')(session);
var createError = require('http-errors');
var log = require('./mods/log')(module);
var users = require('./mods/user');
var vars = require('./mods/vars');
var config = require('./config');
var express = require('express');
var bd = require('./mods/bd');
var http = require('http');
var path = require('path');
var app = express();

// соединение с БД
bd.open((err) => {
	log.debug("Database connect: " + (arguments[0] ? "Ok" : err));
});

// view engine setup
app.engine('ejs' , require('ejs-locals'));
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); //req.cookies

// подключение сессий
var sessionStore = new SQLstore(config.get('bdSession'));
var opts = config.get('session');
app.use(session(Object.assign(opts, {store: sessionStore})));

// логирование доступа к ресурсам
app.use(function(req, res, next) {
  req.user = res.locals.level = "-1";
	var user = new users;
	user.load(req.session.login, (err) => {
		if (err) {
			next();
		} else {
			req.user = user;
			res.locals.level = user.level;
			log.debug(req.method + " " + req.url);
			next();
		}
	});
});

// открытие /public директории для статики
app.use(express.static(path.join(__dirname, 'public')));

// роутеры
app.use('/', indexRouter);
app.use('/file/', fileRouter);
app.use('/kurs', kursRouter);
app.use('/users', usersRouter);
app.use('/schedule', dataRouter);
app.use('/save', saveRouter);
// отлов 404 ошибки
app.use(function(req, res, next) {
  next(createError(404));
});

// обработчик ошибок
app.use(function(err, req, res, next) {
	log.error(req.url+" :: "+err.status+' '+err.message);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (req.method == "POST") {
  	res.render('error', {error: err, currentUser: ""});
  } else {
  	res.render('layedError', {error: err, currentUser: ""});
  }
});

module.exports = app;
