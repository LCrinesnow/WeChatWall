/**
 * Created by Nicholas_Wang on 2016/4/8.
 */
var PORT = 9529;
var http = require('http');
var qs = require('querystring');
var crypto = require('crypto');
var url = require('url');
var xmlParse = require('xml2js').parseString;
var tmpl = require('tmpl');

var getUserInfo = require('./lib/user').getUserInfo;
var wss = require('./lib/ws').wss;


var TOKEN = 'rinesnow';

function checkSignature(params, token) {

    var key = [token, params.timestamp, params.nonce].sort().join('');
    var sha1 = crypto.createHash('sha1');
    sha1.update(key);

    return sha1.digest('hex') == params.signature;
}

var server = http.createServer(function (req, res) {
    var query = url.parse(req.url).query;
    var params = qs.parse(query);

    //console.log(params);
    console.log('token --> '+TOKEN);

    if (!checkSignature(params, TOKEN)) {
        res.end('signature fail');
        return;
    }
    
    if (req.method == 'GET') {
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
                   //console.log(result);
                   if (result.xml.MsgType[0] === 'text') {
                       getUserInfo(result.xml.FromUserName[0])
                           .then(function (userInfo) {
                               //获得用户信息，合并到消息中
                               result.user = userInfo;
                               //将消息通过websocket广播
                               wss.broadcast(result);
                               var reply = replyText(result, '你说得对！');

                               res.end(reply);
                           })
                   } else {
                       var reply = replyText(result, '你说得对！');

                       res.end(reply);
                   }
                   //var reply = replyText(result, '你说得对！');
                   //
                   //res.end(reply);
               }

            });
        });
    }
    
});

function replyText(msg, replyText) {
    //if (msg.xml.MsgType[0] !== 'text') {
    //    return '';
    //}

    //console.log(msg);

    if (msg.xml.MsgType[0] === 'text') {
        var replyTmpl = '<xml>'+
            '<ToUserName><![CDATA[{toUser}]]></ToUserName>'+
            '<FromUserName><![CDATA[{fromUser}]]></FromUserName>'+
            '<CreateTime><![CDATA[{time}]]></CreateTime>'+
            '<MsgType><![CDATA[{type}]]></MsgType>'+
            '<Content><![CDATA[{content}]]></Content>'+
            '</xml>';
        return tmpl(replyTmpl, {
            toUser: msg.xml.FromUserName[0],
            fromUser: msg.xml.ToUserName[0],
            type: 'text',
            time: Date.now(),
            content: replyText
        });
    } else if (msg.xml.MsgType[0] === 'image') {

        var replyImage = '<xml>'+
            '<ToUserName><![CDATA[{toUser}]]></ToUserName>'+
            '<FromUserName><![CDATA[{fromUser}]]></FromUserName>'+
            '<CreateTime><![CDATA[{time}]]></CreateTime>'+
            '<MsgType><![CDATA[{type}]]></MsgType>'+
            '<Image>' +
            '<MediaId><![CDATA[{media_id}]]></MediaId>'+
            '</Image>'+
            '</xml>';

        return tmpl(replyImage, {
            toUser: msg.xml.FromUserName[0],
            fromUser: msg.xml.ToUserName[0],
            type: 'image',
            time: Date.now(),
            media_id: msg.xml.MediaId[0]
        });
    } else if (msg.xml.MsgType[0] === 'voice') {

        var replyTmpl = '<xml>'+
            '<ToUserName><![CDATA[{toUser}]]></ToUserName>'+
            '<FromUserName><![CDATA[{fromUser}]]></FromUserName>'+
            '<CreateTime><![CDATA[{time}]]></CreateTime>'+
            '<MsgType><![CDATA[{type}]]></MsgType>'+
            '<Voice>' +
            '<MediaId><![CDATA[{media_id}]]></MediaId>'+
            '</Voice>'+
            '</xml>';
        return tmpl(replyTmpl, {
            toUser: msg.xml.FromUserName[0],
            fromUser: msg.xml.ToUserName[0],
            type: 'voice',
            time: Date.now(),
            media_id: msg.xml.MediaId[0]

        });
    } else if (msg.xml.MsgType[0] === 'video') {
        var replyTmpl = '<xml>'+
            '<ToUserName><![CDATA[{toUser}]]></ToUserName>'+
            '<FromUserName><![CDATA[{fromUser}]]></FromUserName>'+
            '<CreateTime><![CDATA[{time}]]></CreateTime>'+
            '<MsgType><![CDATA[{type}]]></MsgType>'+
            '<Video>' +
            '<MediaId><![CDATA[{media_id}]]></MediaId>'+
            '<ThumbMediaId><![CDATA[{thumb_media_id}]]></ThumbMediaId>'+
            '</Video>'+
            '</xml>';
        return tmpl(replyTmpl, {
            toUser: msg.xml.FromUserName[0],
            fromUser: msg.xml.ToUserName[0],
            type: 'video',
            time: Date.now(),
            media_id: msg.xml.MediaId[0],
            thumb_media_id: msg.xml.ThumbMediaId[0]
        });
    } else if (msg.xml.MsgType[0] === 'shortvideo') {
        var replyTmpl = '<xml>'+
            '<ToUserName><![CDATA[{toUser}]]></ToUserName>'+
            '<FromUserName><![CDATA[{fromUser}]]></FromUserName>'+
            '<CreateTime><![CDATA[{time}]]></CreateTime>'+
            '<MsgType><![CDATA[{type}]]></MsgType>'+
            '<ShortVideo>' +
            '<MediaId><![CDATA[{media_id}]]></MediaId>'+
            '<ThumbMediaId><![CDATA[{thumb_media_id}]]></ThumbMediaId>'+
            '</ShortVideo>'+
            '</xml>';
        return tmpl(replyTmpl, {
            toUser: msg.xml.FromUserName[0],
            fromUser: msg.xml.ToUserName[0],
            type: 'shortvideo',
            time: Date.now(),
            media_id: msg.xml.MediaId[0],
            thumb_media_id: msg.xml.ThumbMediaId[0]
        });
    } else if (msg.xml.MsgType[0] === 'location') {
        //return tmpl(replyTmpl, {
        //    toUser: msg.xml.FromUserName[0],
        //    fromUser: msg.xml.ToUserName[0],
        //    type: 'location',
        //    time: Date.now(),
        //    content: replyText
        //});
    } else if (msg.xml.MsgType[0] === 'link') {
        //return tmpl(replyTmpl, {
        //    toUser: msg.xml.FromUserName[0],
        //    fromUser: msg.xml.ToUserName[0],
        //    type: 'link',
        //    time: Date.now(),
        //    content: replyText
        //});
    } else {
        return '';
    }

}

server.listen(PORT);

console.log('Server running at port: '+PORT);