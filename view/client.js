var Chat = {
	userid : Expresso.userId,
	username : Expresso.userName,
	useravatar : Expresso.userAvatar,
	
	connect : function() {
		chatsocket.emit('adduser', {name: Chat.username, id: Chat.userid, avatar: Chat.useravatar});
		$('#chat_users ul').html("<li>aguarde, carregando...</li>");
		
	},
	
	disconnect : function() {
		//chatsocket.emit('disconnect');
		//$('#chat_users ul').html("<li>aguarde, carregando...</li>");
	},
	
	connected_ids : []
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
			$("#chats").append("<div id=\"" + self.window_id + "\"><header><img src='" + self.avatar + "' />" + self.targetname + "<span class='chat_plusminus'>+/-</span></header><div><ul></ul><textarea></textarea></div></div>");
		else
			$("#chats").append("<div id=\"" + self.window_id + "\"><header>" + self.targetname + "<span class='chat_plusminus'>+/-</span></header><div><ul></ul><textarea></textarea></div></div>");
		
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
			$(this).parent().parent().toggleClass("hidden");
		});
		
	} else {
		self.el = $("#" + self.window_id);
	}
	
	
	this.freeze = function() {
		var txtarea = self.el.find("textarea");
		txt.attr('readonly','readonly');
	};
	
	

	this.add_msg = function(data) {

		var ul = self.el.find("ul");
		
		if(data.name == null ) {
			msg = "<strong>você</strong>: " + data.message;
		}
		else {
			msg = "<strong>ele</strong>: " + data.message;	
		}
		
		self.el.find("ul").append("<li>" + msg + "</li>");
	}

	return this;
}

$("body").append('<div id="chat_users" class="disconnected"><header></header><ul></ul></div><div id="chats"></div>');
$('#chat_users header').html(Chat.username + "<span class='chat_onoff'>on/off</span><span class='chat_plusminus'>+/-</span>");

$("#chat_users span.chat_onoff").off("click").on("click", function() {
	chatsocket.emit('toggle_connection', {name: Chat.username, id: Chat.userid, avatar: Chat.useravatar, force: false});
});

$("#chat_users span.chat_plusminus").off("click").on("click", function() {
	$("#chat_users").toggleClass("hidden");
});



var chatsocket = io.connect('http://localhost:8094');

chatsocket.on('connect', function(){
	
	chatsocket.emit('check_status', {user_id: Chat.userid, cb: null});
	chatsocket.on('get_status', function(status, cb) {
		if(status=="connected") {
			chatsocket.emit('toggle_connection', {name: Chat.username, id: Chat.userid, avatar: Chat.useravatar, force: true});
		}
	});
	
	chatsocket.on('updateusers', function(data, status) {
			
		if(status=="disconnected") {
			
			$('#chat_users ul').html("");
			$("#chats").html("");
			$("#chat_users").addClass("disconnected");
			return;
		}
		
		
		if(status!="keep")
			$("#chat_users").removeClass("disconnected");
		
		Chat.connected_ids = [];
		var html = "";
		$.each(data, function(key, value) {
			if(data[key].id != Chat.userid) {
				html += '<li data-userid="' + data[key].id + '"><img src="' + data[key].avatar + '" />' + data[key].name + '</li>';
			}
			Chat.connected_ids.push(data[key].id);
		});
		$('#chat_users ul').html(html);
		
		$('#chat_users ul').on("click", "li", function() {
			var name = $(this).html();
			var id = $(this).data("userid");
			var chat_window = new ChatWindow({id: id, name: name, ownerid: Chat.userid});
		});
		
		$("span.chat-userstatus-led").removeClass("connected").addClass("disconnected");
		
		$.each(Chat.connected_ids, function(key, value) {
			$("span.chat-userstatus-led_" + value).removeClass("disconnected").addClass("connected");
		});
		
		//freeze windows from disconnected
		/*
		$("#chats > div").each(function(index, item) {
			var id = $(item).data("userid");
			//alert(id)
			if(!Chat.connected_ids.contains(id)) {
				var cw = new ChatWindow({id: id});
				cw.freeze();
			}
		});
		*/
		
	});
	
});

chatsocket.on('updatechat', function(data) {
	var chat_window = new ChatWindow({id: data.from, name: data.name, ownerid: Chat.userid, avatar: data.avatar});

	chat_window.add_msg({name: data.name, message: data.message});
});


chatsocket.on('updatedchat', function(data) {
	var chat_window = new ChatWindow({id: data.to, name: null});

	chat_window.add_msg({name: null, message: data.message});
});


$(".listMycontacts h3 a").each(function(index, item) {
	
	$(item).after("<span data-userid='" + $(item).data("userid") + "' data-username='" + $(item).html() + "' class='chat-userstatus-led chat-userstatus-led_" + $(item).data("userid") + "'>status</span>");
	//chatsocket.emit("check_otheruser_status", {user_id: $(item).data("userid"), type: "mycontacts"} );
});

$(document).on("click", "span.chat-userstatus-led.connected", function() {
	var name = $(this).data("username");
	var id = $(this).data("userid");
	var avatar = $(this).parent().parent().parent().find("img").attr("src");
	var chat_window = new ChatWindow({id: id, name: name, ownerid: Chat.userid, avatar: avatar});
});

chatsocket.on('get_otheruser_status', function(data) {
	
	$(".chat-userstatus-led_" + data.user_id).addClass(data.status);
});


chatsocket.on('notupdatedchat', function(data) {
	
	var chat_window = new ChatWindow({id: data.to, name: null});

	chat_window.add_msg({name: null, message: data.message + " (usuário não está vendo)"});
});


//disconnect
//$(window).on("unload", function() {
//	chatsocket.emit('disconnectuser', {userid: 9}); 
//});
