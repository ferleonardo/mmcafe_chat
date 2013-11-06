var chatsocket = null;
var Chat = function(data) {
	this.server = data.server;
	this.userid = data.userid;
	this.username = data.username;
	this.uservatar = data.useravatar;

	var self = this;

	this.loader = "...";
	this.connected_ids = [];

	$("body").append('<div id="chat_users" class="waiting"><header></header><ul></ul></div><div id="chats"></div>');
	$('#chat_users header').html(self.username + "<span class='chat_onoff'>on/off</span><span class='chat_plusminus'>-</span>");
	$('#chat_users ul').html("<li><img src='' />" + self.loader + " verificando status...</li>");

	$("#chat_users span.chat_onoff").off("click").on("click", function() {
		if($("#chat_users").hasClass("waiting"))
			return false;
		$('#chat_users ul').html("<li><img src='' />" + self.loader + " aguarde...</li>");
		chatsocket.emit('toggle_connection', {name: self.username, id: self.userid, avatar: self.useravatar, force: false});
	});

	$("#chat_users span.chat_plusminus").off("click").on("click", function() {
		$("#chat_users").toggleClass("hidden");

		if($("#chat_users").hasClass("hidden"))
			$(this).html("+");
		else
			$(this).html("-");
	});

	
}

var ChatWindow = function(data) {
	var self = this;

	this.targetid = data.id;
	this.targetname = data.name;
	this.avatar = data.avatar;
	this.window_id = "chatwindow_" + self.targetid;
	this.el = null;


	this.render = function() {
		if(self.avatar)
			$("#chats").append("<div id=\"" + self.window_id + "\"><header><img src='" + self.avatar + "' />" + self.targetname + "<span class='chat_plusminus'>-</span></header><div><ul></ul><textarea></textarea></div></div>");
		else
			$("#chats").append("<div id=\"" + self.window_id + "\"><header>" + self.targetname + "<span class='chat_plusminus'>-</span></header><div><ul></ul><textarea></textarea></div></div>");
		
	};

	if($("#" + self.window_id).length == 0){
		self.last = null;
		this.ownerid = data.ownerid;
		this.render();
		self.el = $("#" + self.window_id);
		var txtarea = self.el.find("textarea");

		txtarea.on("keypress", function(e) {
			if(e.which == 13) {
				$(this).blur();
				chatsocket.emit('sendchat', {target: self.targetid, message: $(txtarea).val()});
				txtarea.val("");
			}
		});
		
		
		self.el.find("header span.chat_plusminus").on("click", function() {
			var el = $(this).parent().parent();
			el.toggleClass("hidden");
			if(el.hasClass("hidden"))
				$(this).html("+");
			else
				$(this).html("-");
		});
		
	} else {
		self.el = $("#" + self.window_id);
	};
	
	

	this.add_msg = function(data) {

		var ul = self.el.find("ul");
		
		if(data.name == null ) {
			msg = "<li class='chat_you'>" + data.message + "</li>";
		}
		else {
			msg = "<li class='chat_him'> " + data.message  + "</li>";	
		}
		var ul = self.el.find("ul");
		ul
			.append(msg)
			.animate({ scrollTop: ul.height() }, "fast");
		ul.parent().find("textarea").focus();
	}

	return this;
}

Chat.prototype.init = function(data) {
	var self = this;
	chatsocket = io.connect(self.server);

	chatsocket.on('connect', function(){
		
		$('#chat_users ul').html("<li><img src='' />" + self.loader + " verificando status...</li>");
		chatsocket.emit('check_status', {user_id: self.userid, cb: null});
		chatsocket.on('get_status', function(status, cb) {
			if(status=="connected") {
				$('#chat_users ul').html("<li><img src='' />" + self.loader + " conectando...</li>");
				chatsocket.emit('toggle_connection', {name: self.username, id: self.userid, avatar: self.useravatar, force: true});
			} else {
				$("#chat_users")
					.removeClass("waiting")
					.addClass("disconnected");
				
				$('#chat_users ul').html("<li></li>");
			}
		});
		
		chatsocket.on('updateusers', function(data, status) {
			$("#chat_users").removeClass("waiting");
			if(status=="disconnected") {
				
				$('#chat_users ul').html("");
				$("#chats").html("");
				$("#chat_users").addClass("disconnected");
				return;
			}
			
			
			if(status!="keep")
				$("#chat_users").removeClass("disconnected");
			
			self.connected_ids = [];
			var html = "";
			$.each(data, function(key, value) {
				if(data[key].id != self.userid) {
					html += '<li data-userid="' + data[key].id + '"><img src="' + data[key].avatar + '" />' + data[key].name + '</li>';
				}
				self.connected_ids.push(data[key].id);
			});
			$('#chat_users ul')
				.html(html)
				.on("click", "li", function() {
					var name = $(this).html();
					var id = $(this).data("userid");
					var chat_window = new ChatWindow({id: id, name: name, ownerid: self.userid});
				});
			
			$("span.chat-userstatus-led").removeClass("connected").addClass("disconnected");
			
			$.each(self.connected_ids, function(key, value) {
				$("span.chat-userstatus-led_" + value).removeClass("disconnected").addClass("connected");
			});
			

		});
		
	});

	chatsocket.on('updatechat', function(data) {
		var chat_window = new ChatWindow({id: data.from, name: data.name, ownerid: self.userid, avatar: data.avatar});

		chat_window.add_msg({name: data.name, message: data.message});
	});


	chatsocket.on('updatedchat', function(data) {
		var chat_window = new ChatWindow({id: data.to, name: null});

		chat_window.add_msg({name: null, message: data.message});
	});



	chatsocket.on('notupdatedchat', function(data) {
		
		var chat_window = new ChatWindow({id: data.to, name: null});

		chat_window.add_msg({name: null, message: data.message + " (usuário não está vendo)"});
	});

	if(data.onconnect) {
		data.onconnect(chatsocket);
	}

}