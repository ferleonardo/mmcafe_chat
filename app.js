//var app = require('express').createServer();
var express = require("express")
	, app = express()
	, http = require('http')
	, server = http.createServer(app);

var io = require('socket.io').listen(server);

var fs = require('fs');

var config = require('./config');
var logger = require('./logger');

server.listen(config.socketport);

/*
app.on("close", function() {
	logger.server_op("servidor desligado");
});
*/


process.on('SIGINT', function () {
	users = {};
	io.sockets.clients('chat').forEach(function(socket) {
		socket.emit('updateusers', {}, "disconnected");
	});
	logger.server_op("servidor desligado");
	setTimeout(function() {
		process.exit();	
	}, 10);
	
});

logger.server_op("servidor iniciado");

io.configure('development', function(){
  io.set('transports', ['xhr-polling']);
});

if(config.origin!="")
	io.set("origins", config.origin);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/index.html', function (req, res) {
  res.sendfile('index.html', {root: __dirname});
});

/*
process.on('uncaughtException', function(err) {
    console.log(err);
});
*/


var users = {};

io.sockets.on('connection', function (socket) {

	socket.on('adduser', function(data){
		// we store the username in the socket session for this client
		socket.user_id = data.id;
		// add the client's username to the global list
		users[data.id] = {name: data.name, id: data.id};

		socket.emit("send_status", users);
		socket.join(data.id);
	});

	socket.on('disconnect', function() {
		if(users[socket.user_id])
			users[socket.user_id].status = "notavailable";
	});

	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		logger.chat_op(data.target, socket.user_id, data.message);
		if(users[data.target]!=undefined) {
			if(users[data.target].status == "visible") {
				io.sockets.in(socket.user_id).emit('updatedchat', {to: data.target, message: data.message});
				io.sockets.in(data.target).emit('updatechat', {from: socket.user_id, name: users[socket.user_id].name, message: data.message, avatar: users[socket.user_id].avatar});	
			} else {

				io.sockets.in(socket.user_id).emit('notupdatedchat', {to: data.target, reason: users[data.target].status, message: data.message});


				var q = {	name : users[socket.user_id].name,
							id : socket.user_id,
							avatar : users[socket.user_id].avatar,
							message : data.message
				};
		

				var fileName = config.queue.path + "/" + data.target + ".json";
				fs.exists(fileName, function (exists) {
					if(exists){
						fs.readFile(fileName, function(err, datastr) {
							try {
								var arr = JSON.parse(datastr);
								arr.push(q);
								var str = JSON.stringify(arr);
								fs.writeFile(fileName, str);
							} catch(err) {
								console.log(err);
							}
						});
					} else {
						var arr = [];
						arr.push(q);
						try {
							var str = JSON.stringify(arr);
							fs.writeFile(fileName);
							fs.writeFile(fileName, str);
						} catch(err) {
							console.log(err);
						}
					}
				});


			}
			
		}
	});

	socket.on("check_status", function(data) {
		if(users[data.user_id]!=undefined)
			socket.emit('get_status', "connected", data.cb);
		else
			socket.emit('get_status', "disconnected", data.cb);
	});

	socket.on("check_otheruser_status", function(data) {
		if(users[data.user_id]!=undefined)
			socket.emit('get_otheruser_status', {status: "connected", type: data.type, user_id: data.user_id});
		else
			socket.emit('get_otheruser_status', {status: "disconnected", type: data.type, user_id: data.user_id });
	});

	socket.on('toggle_connection', function(data){
		
		if(users[data.id]!=undefined && !data.force) {
			// remove the username from global usernames list
			delete users[data.id];
			// update list of users in chat, client-side
			
			socket.broadcast.to("chat").emit('updateusers', users, "keep");
			socket.emit('updateusers', users, "disconnected");

			logger.single_op(data.id, "desconectou");
			//socket.leave(data.id);
			socket.leave("chat");
			socket.leave(data.id);
		} else {
			socket.user_id = data.id;
			// add the client's username to the global list

			users[data.id] = {name: data.name, id: data.id, avatar: data.avatar, status: "visible"};
			
			socket.join("chat");
			socket.join(data.id);

			socket.broadcast.to("chat").emit('updateusers', users, "keep");
			socket.emit('updateusers', users, "connected");

			logger.single_op(data.id, "conectou");


			fs.readFile(config.queue.path + "/" + data.id + ".json", function(err, data) {

				if(err) {
					console.log(err);
				} else {
					if(data==null || data=="")
						return false;
					JSON.parse(data).forEach(function(item) { 
						io.sockets.in(socket.user_id).emit('updatechat', {from: item.id, name: item.name, message: item.message, avatar: item.avatar});	
					});

					fs.unlink(config.queue.path + "/" + socket.user_id + ".json", function (err) {
					if (err) throw err;
						console.log('successfully deleted');
					});
				}
				
			}); 
			
			
		}
	});

});

