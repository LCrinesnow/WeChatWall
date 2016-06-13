
var express =  require('express');
var app = express();
var url = require('url');
var qs = require('querystring');
var crypto = require('crypto');
var xmlParse = require('xml2js').parseString;
var TOKEN = 'rinesnow';
var getUserInfo = require('./lib/user').getUserInfo;

function checkSignature(params, token){
    var key = [token, params.timestamp, params.nonce].sort().join('');
    var sha1 = crypto.createHash('sha1');
    sha1.update(key);
    return sha1.digest('hex') == params.signature;
}

var messages = [];
messages.push('微信墙启动!');

//设置静态文件路径,且要放在上面 use 中间件的后面，否则微信配置不通过
app.use('/client',express.static(__dirname + '/client'));

app.use('/wall',function (req, res) {
    console.log('visit this page wall');
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/',function (req, res) {
    var query = url.parse(req.url).query;
    var params = qs.parse(query);

    console.log('token -->', TOKEN);

    if(!checkSignature(params, TOKEN)){
        res.end('signature fail');
        return;
    }

    if(req.method == 'GET'){
        res.end(params.echostr);
    } else {
        var postdata = '';

        req.addListener('data', function (postchunk) {
            postdata += postchunk;
        });

        req.addListener('end', function () {
            console.log(postdata);
            xmlParse(postdata, function (err, result) {
                if (!err) {
                    //获取用户发送过来的消息
                    console.log('微信消息：',result);
                    if (result.xml.MsgType[0] === 'text') {
                        getUserInfo(result.xml.FromUserName[0])
                            .then(function (userInfo) {
                                //获得用户信息，合并到消息中
                                result.user = userInfo;
                                //console.log('user info:',userInfo);
                                //将消息通过websocket广播

                                messages.unshift(result);
                                //console.log('messages:',messages);
                                io.socket.emit('newMessage', result);
                                //wss.broadcast(result);
                                var reply = replyText(result, '消息发送成功');

                                res.sendFile(__dirname + '/client/index.html');
                            });
                    }
                }

            });
        });
    }
});




var server = app.listen(9529, function () {
   console.log('app is running at port 9529!');
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
    console.log('connected');
    socket.emit('connected');
    socket.broadcast.emit('newClient', new Date());

    socket.on('getAllMessages', function () {
        socket.emit('allMessage',messages);
    });

    socket.on('addMessage', function (message) {
        messages.unshift(message);
        io.sockets.emit('newMessage', message);
    });
});

