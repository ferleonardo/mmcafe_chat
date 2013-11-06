var config = {};

config.origin = "localhost:8080";
config.socketport = "3000";

config.queue = {
	path : "queues"
};

config.logging = {
	path: "logs",
	chat_path: "logs/chat"
}

module.exports = config;
