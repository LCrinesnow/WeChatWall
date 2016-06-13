var express = require('express');
var app = express();
var http = require('http');
var qs = require('qs');
var later = require('later');
var request = require('request');
var TOKEN = 'rinesnow';

app.use(express.static('./wechatwall/views'));

app.use(function (req,res) {
  res.sendFile('./wechatwall/views/index.html');
});


var asses_token;
var appID = 'wx75d11b4f981b1ded';
var appSecret = '7a915c525f39451f3af19407012459ad';


//setTimeout(getToken(appID,appSecret),2000);
//////////wechat parse//////////////////
function checkSignature(params, token) {
    //1. 将token、timestamp、nonce三个参数进行字典序排序
    //2. 将三个参数字符串拼接成一个字符串进行sha1加密
    //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信

    var key = [token, params.timestamp, params.nonce].sort().join('');
    var sha1 = require('crypto').createHash('sha1');
    sha1.update(key);

    return sha1.digest('hex') == params.signature;
}

var server = http.createServer(function(request,response){
    var query = require('url').parse(request.url).query;
    var params = qs.parse(query);

    if (!checkSignature(params, TOKEN)) {
        response.end('signature fail');
    }

    var postdata = "";

    request.addListener("data", function (postchunk) {
        postdata += postchunk;
    });

    request.addListener("end", function () {
        console.log(postdata);
        var parseString = require('xml2js').parseString;
        parseString(postdata, function (err, result) {
            if (err) console.log('parse err');
            else {
                getUserInfo(result.xml.FromUserName[0], function (userInfo) {
                    result.user = userInfo;
                    socket.broadcast.emit('newUserInfo',result);
                });
                   /* .then(function (userInfo) {
                        //获得用户信息，合并到消息中
                        result.user = userInfo;
                        //将消息通过websocket广播
                        wss.broadcast(result);
                        if (result.xml.MsgType[0] == 'text') {
                            var res = replyText(result, '消息推送成功！');
                            console.log(res);
                        }
                        else if (result.xml.MsgType[0] == 'image')
                            var res = replyText(result, '图片推送成功！');
                        response.end(res);
                    });*/
            }
        });

    });
});

server.listen(9529,function(){
    //console.log('listen');
});

later.date.localTime();
var sched = later.parse.recur().every(5).second();
var t =later.setInterval(getToken(appID,appSecret),sched);
//later.schedule(sched).next(10);
function getToken(appID, appSecret){
        request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appID+'&secret=' + appSecret, function(err, res, data){
             asses_token = JSON.parse(data);
             console.log(asses_token);
        });
    console.log('1');
}


function getUserInfo(openID,callback){
    var token = asses_token.access_token;

    request('https://api.weixin.qq.com/cgi-bin/user/info?access_token='+token+'&openid='+openID+'&lang=zh_CN', function(err, res, data){
        callback(JSON.parse(data));
        //resolve(JSON.parse(data));
    });


}














////////socket connect////////////////////////////////
var messages = [];
messages.push('welcome myChat');

var io = require('socket.io').listen(server);
io.sockets.on('connection',function(socket){
  socket.emit('connected');
  console.log('connected');

  socket.broadcast.emit('newClient',new Date());

  socket.on('getAllMessages',function(){
      socket.emit('allMessages',messages);
  });

  socket.on('addMessage',function(message){
      messages.unshift(message);
      io.sockets.emit('newMessage',message);
  });
});