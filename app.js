var app = require('express').createServer()
var io = require('socket.io').listen(app);

var fs = require('fs');

var config = require('./config');

app.listen(config.socketport);

io.configure('development', function(){
  io.set('transports', ['xhr-polling']);
});

io.set("origins", config.origin);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


var User = function() {
	this.name = null;
	this.id = null;
	this.avatar = null;
};

var Queue = [];

/*
var queuedMessage = {
	this.name : null,
	this.id : null,
	this.avatar : null,
	this.message : null
};
*/

var users = {};

io.sockets.on('connection', function (socket) {

	/*
	setInterval(function() {
		var clients = io.sockets.clients();
		for(var i=0; i<clients.length; i++) {
			users[clients[i]]);
		}
	}, 15000);
*/

	socket.on('adduser', function(data){
		// we store the username in the socket session for this client
		socket.user_id = data.id;
		// add the client's username to the global list
		users[data.id] = {name: data.name, id: data.id};
		// echo to client they've connected
		//socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		//socket.broadcast.emit('updatechat', 'SERVER', data.name + ' has connected');
		// update the list of users in chat, client-side

		socket.emit("send_status", users);
		socket.join(data.id);
	});


	socket.on('disconnect', function() {
		//delete users[socket.user_id];
		// update list of users in chat, client-side
		//socket.broadcast.emit('updateusers', users, "keep");
		//io.sockets.in(socket.user_id).emit('updateusers', users, "disconnected");
		//socket.leave(data.id);

		users[socket.user_id].status = "notavailable";

	});

	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		if(users[data.target]!=undefined) {
			if(users[data.target].status == "visible") {
				io.sockets.in(socket.user_id).emit('updatedchat', {to: data.target, message: data.message});
				io.sockets.in(data.target).emit('updatechat', {from: socket.user_id, name: users[socket.user_id].name, message: data.message, avatar: users[socket.user_id].avatar});	
			} else {
				io.sockets.in(socket.user_id).emit('notupdatedchat', {to: data.target, reason: users[data.target].status, message: data.message});
				Queue[data.target] = Queue[data.target] || [];
				Queue[data.target].push({
					name : users[socket.user_id].name,
					id : socket.user_id,
					avatar : users[socket.user_id].avatar,
					message : data.message
				});

				var str = JSON.stringify(Queue[data.target]);

				fs.writeFile(config.queue.path + "/" + data.target + ".json", str, function(err) {
					if(err) {
						console.log(err);
					}
				}); 
			}
			
		}
	});

	socket.on("check_status", function(data) {
		if(users[data.user_id]!=undefined)
			io.sockets.in(socket.user_id).emit('get_status', "connected", data.cb);
		else
			io.sockets.in(socket.user_id).emit('get_status', "disconnected", data.cb);
	});

	socket.on("check_otheruser_status", function(data) {
		if(users[data.user_id]!=undefined)
			io.sockets.in(socket.user_id).emit('get_otheruser_status', {status: "connected", type: data.type, user_id: data.user_id});
		else
			io.sockets.in(socket.user_id).emit('get_otheruser_status', {status: "disconnected", type: data.type, user_id: data.user_id });
	});

	socket.on('toggle_connection', function(data){
		
		if(users[data.id]!=undefined && !data.force) {
			// remove the username from global usernames list
			delete users[data.id];
			// update list of users in chat, client-side
			socket.broadcast.emit('updateusers', users, "keep");
			io.sockets.in(socket.user_id).emit('updateusers', users, "disconnected");
			socket.leave(data.id);
		} else {
			socket.user_id = data.id;
			// add the client's username to the global list

			users[data.id] = {name: data.name, id: data.id, avatar: data.avatar, status: "visible"};
			//io.sockets.emit('updateusers', users, "connected", "keep");

			socket.join(data.id);

			socket.broadcast.emit('updateusers', users, "keep");
			io.sockets.in(socket.user_id).emit('updateusers', users, "connected");


			fs.readFile(config.queue.path + "/" + data.id + ".json", function(err, data) {

				if(err) {
					console.log(err);
				} else {
					JSON.parse(data).forEach(function(item) { 
						io.sockets.in(socket.user_id).emit('updatechat', {from: item.id, name: item.name, message: item.message, avatar: item.avatar});	
					});

					fs.unlink(config.queue.path + "/" + socket.user_id + ".json", function (err) {
					if (err) throw err;
						console.log('successfully deleted /tmp/hello');
					});
				}
				
			}); 
			//send queued messages
			//if(queue[data.id]) {
				
			//	delete queue[data.id];
			//}
			
		}
	});

});