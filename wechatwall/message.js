var PORT = 9529;
var http = require('http');
var qs = require('qs');
var crypto =require('crypto');
var url=require('url');
var xml2js =require('xml2js');

var TOKEN = 'rinesnow';

function checkSignature(params,token){
	//1.将token、timestamp、nonce三个参数进行字典序排序
	//2.将三个参数字符串拼接成一个字符串进行sha1加密
	//3.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信  return true/false

	var key = [token, params.timestamp,params.nonce].sort().join('');//拼接
	var sha1 = crypto.createHash('sha1');
	sha1.update(key);
	return sha1.digest('hex')==params.signature;

}

var server = http.createServer(function (request,response){
	//解析URL中的Query部分，用qs模块（npm install qs）将Query解析成json
	var query = url.parse(request.url).query;
	var params = qs.parse(query);

	console.log(params);
	console.log("token-->",TOKEN);

	if(!checkSignature(params,TOKEN)){
		// response.end(params.echostr);不能乱response.end！否则后面response 用不了了！
		response.end('signature fail');
		return;
	}else{
		console.log("chenggong");
	}
		console.log(request.method+'/////');

	//若请求时GET，返回echostr用于通过服务器有效检验
	if(request.method=='GET'){
		response.end(params.echostr);
	}else{
	//否则是微信给开发者服务器的POST请求
		var postdata = '';

		request.addListener('data',function (postchunk){
			postdata += postchunk;
		});
		// console.log(postdata+'dfsdf');

		request.addListener('end',function (){
			console.log(postdata);
			var parseString=xml2js.parseString;
			parseString(postdata,function (err, result){
				if(!err){
					console.log(result);
					console.log(result.MsgType);
					response.end('success');
				}
			});
		});
	}
});
// function reply(){

// }
server.listen(PORT);
console.log("Server running at port:"+PORT+".");