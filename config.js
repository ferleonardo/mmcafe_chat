var config = {};

config.origin = "http://localhost:8080:";
config.socketport = "3010";

config.queue = {
	path : "queues"
};

config.logging = {
	path: "logs",
	chat_path: "logs/chat"
}

module.exports = config;
