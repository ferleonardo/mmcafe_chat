var config = require('./config');
var fs = require('fs');
var logger = {};


logger.single_op = function(user_id, msg) {
	var now = new Date();
	var msg = "\n" + now + " - usuário " + user_id + " " + msg;
	
	var file_prefix = now.getFullYear() + "_" + now.getMonth() + "_" + now.getDate();

	fs.appendFile(config.logging.path + "/" + file_prefix + "_access.log", msg, function(err) {
		if (err)
			throw console.log('Erro ao salvar no log');

	});
};

logger.chat_op = function(user_id, otheruser_id, msg) {
	var now = new Date();
	var msg = "\n" + now + " - usuário " + otheruser_id + ": " + msg;
	
	var file_prefix = now.getFullYear() + "_" + now.getMonth() + "_" + now.getDate();

	if(parseInt(user_id) > parseInt(otheruser_id)) {
		var userprefix = otheruser_id + "_" + user_id;
	} else {
		var userprefix = user_id + "_" + otheruser_id;
	}

	fs.appendFile(config.logging.chat_path +"/" + file_prefix + "_" + userprefix + ".log", msg, function(err) {
		if (err)
			throw console.log('Erro ao salvar no log');

	});
};

logger.server_op = function(msg) {
	var now = new Date();
	var msg = "\n" + now + " - " + msg;
	
	var file_prefix = now.getFullYear() + "_" + now.getMonth() + "_" + now.getDate();

	fs.appendFile(config.logging.path + "/" + file_prefix + "_access.log", msg, function(err) {
		if (err)
			throw console.log('Erro ao salvar no log');

	});
};

module.exports = logger;