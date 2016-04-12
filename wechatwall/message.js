var PORT = 9529;
var http = require('http');
var qs = require('qs');

var TOKEN = 'rinesnow';

function checkSignature(params,token){
	//1.将token、timestamp、nonce三个参数进行字典序排序
	//2.将三个参数字符串拼接成一个字符串进行sha1加密
	//3.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信  return true/false

	var key = [token, params.timestamp,params.nonce].sort().join('');//拼接
	var sha1 = require('crypto').createHash('sha1');
	sha1.update(key);
	return sha1.digest('hex')==params.signature;

}

var server = http.createServer(function(request,response){
	//解析URL中的Query部分，用qs模块（npm install qs）将Query解析成json
	var url=require('url');
	var query = url.parse(request.url).query;
	var params = qs.parse(query);

	console.log(params);
	console.log("token-->",TOKEN);

	if(checkSignature(params,TOKEN)){
		console.log("chenggong");
		response.end(params.echostr);

	}else{
		response.end('signature fail');
		return;
	}

	//若请求时GET，返回echostr用于通过服务器有效检验
	if(request.method=="GET"){
		response.end(params.echostr);
	}else{
	//否则是微信给开发者服务器的POST请求
		var postdata = "";
		request.addListener("data",function(postchunk){
			postdata+= postchunk;
		});
		request.addListener("end",function(){
			console.log(postdata);
			response.end('success');
		});
	}

});

server.listen(PORT);
console.log("Server running at port:"+PORT+".");