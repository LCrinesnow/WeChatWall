var express=require('express');
var socketio=require('socket.io');
var app = express();

// 设置静态文件路径
app.use(express.static(__dirname + '/client'));

app.use(function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

var server = app.listen(3000, function () {
    console.log('app is running at port 3000 !');
});

var io = socketio.listen(server);

var messages = [];
messages.push('欢迎你来到myChat!');

io.sockets.on('connection', function(socket){
    console.log('connected');
    socket.emit('connected');
    socket.broadcast.emit('newClient',new Date());

    socket.on('getAllMessages',function(){
        socket.emit('allMessages',messages);
    });

    socket.on('addMessage',function(message){
        messages.unshift(message);
        io.sockets.emit('newMessage',message);
    });
});
