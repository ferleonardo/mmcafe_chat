var config = {};

config.origin = "localhost:8080";
config.socketport = "8094";

config.queue = {
	path : "queues"
};

config.logging = {
	path: "logs",
	chat_path: "logs/chat"
}

module.exports = config;