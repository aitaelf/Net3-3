const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const DBurl = 'mongodb://localhost:27017/usertask';

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/usertask', {useMongoClient: true});
const db = mongoose.connection;
mongoose.Promise = global.Promise;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
	console.log('db ok');
});

const Schema = mongoose.Schema;
// Пользователи:
const userSchema = new Schema({
	name: String,
	lastname: String,
});

app.get('/user', (req, res) => {
	showCollection('users')
		.then(result => res.send(result));
});

// Создать
app.post('/user', (req, res) => {
	let User = mongoose.model('User', userSchema);
	let newUser = new User({
		name: req.body.name,
		lastname: req.body.lastname
	});
	newUser.save((err) => {
		if (err) { 
			res.send(err); 
		} else { 
			res.send(true); 
		}
	});
});

// Редактировать
app.put('/user', (req, res) => {
	if (req.body.field !== 'name' && req.body.field !== 'lastname') {
		res.send(`'field' must be 'name' or 'lastname'`);
	} else {
		let User = mongoose.model('User', userSchema); // Почему если вынести эту строку в глобальные переменные - оно не работает? Запрос просто зависает.
		User.findOne({ _id: req.body.id }, (err, doc) => {
			if (err) res.send(err);
			doc[req.body.field] = req.body.value;
			doc.save((err, result) => {
				if (err) res.send(err);
				else res.send(result);
			});
		});
	}	
});

// Удалить
app.delete('/user', (req, res) => {
	let User = mongoose.model('User', userSchema);
	User.remove({_id:req.body.id}, (err) => {
		if (err) {
			res.send(err); 
		} else {
			res.send(true); 
		}
	});
});

// Задачи:
const taskSchema = new Schema({
	title: String,
	description: String,
	finished: Boolean,
	user: String
});

app.get('/task', (req, res) => {
	showCollection('tasks')
		.then(result => res.send(result));
});

// Создать
// тут добавить проверку существования id пользователя
app.post('/task', (req, res) => {
	let Task = mongoose.model('Task', taskSchema);
	let newTask = new Task({
		title: req.body.title,
		description: req.body.description,
		finished: false,
		user: req.body.user
	});
	newTask.save((err) => {
		if (err) { 
			res.send(err); 
		} else { 
			res.send(true); 
		}
	});
});
// Редактировать
app.put('/task', (req, res) => {
	if (req.body.field !== 'title' && req.body.field !== 'description') {
		res.send(`'field' must be 'title' or 'description'`);
	} else {
		editTask(req.body)
			.then(result => res.send(result))
			.catch(err => res.send(err));
	}	
});
// Удалить
app.delete('/task', (req, res) => {
	let Task = mongoose.model('Task', taskSchema);
	Task.remove({_id:req.body.id}, (err) => {
		if (err) {
			res.send(err); 
		} else {
			res.send(true); 
		}
	});
});
// Открыть
app.put('/task/open', (req, res) => {
	editTask({
		id: req.body.id,
		field: 'finished',
		value: false
		})
			.then(result => res.send(result))
			.catch(err => res.send(err));
});
// Закрыть
app.put('/task/close', (req, res) => {
	editTask({
		id: req.body.id,
		field: 'finished',
		value: true
		})
			.then(result => res.send(result))
			.catch(err => res.send(err));
});
// Делегировать
app.put('/task/changeUser', (req, res) => {
	editTask({
		id: req.body.id,
		field: 'user',
		value: req.body.userId
		})
			.then(result => res.send(result))
			.catch(err => res.send(err));
});

function editTask(data) {
	return new Promise((done, fail) => {
		let Task = mongoose.model('Task', taskSchema);
		Task.findOne({ _id: data.id }, (err, doc) => {
			if (err) fail(err);
			doc[data.field] = data.value;
			doc.save((err, result) => {
				if (err) fail(err);
				else done(result);
			});
		});
	});
}

function showCollection(collectionName) {
	return new Promise((done, fail) => {
		MongoClient.connect(DBurl, (err, db) => {
			if(err) {
				fail(err);
			} else {
				let users = db.collection(collectionName);
				users.find().toArray((err, result) => {
					if (err) {
						fail(err);
					} else {
						done(result);
					}
				});
			}
			db.close();
		});
	});
}

app.listen(port, () => {
	console.log('Server enabled on port ' + port);
});