/**
 * Created by Administrator on 2018/4/3.
 */
var router=require('./controller/router.js');
var http=require('http');
var chat_server=require('./controller/chat_server.js');

//-----------------log日志---------------------
var log4js=require('log4js');
var log4js_config=require('./models/log4js_config.json');
log4js.configure(log4js_config);
var logger=log4js.getLogger("cheese");
var logger_error=log4js.getLogger("cheese1");


//ip地址解析
var libqqwry=require("lib-qqwry");
var qqwry=libqqwry.init();
qqwry.speed();

chat_server.connect_chat_room();
http.createServer(function (req,res) {
    var client_ip=req.connection.remoteAddress;
    console.log(req.connection.remoteAddress);
    var ipL=qqwry.searchIP(client_ip);
    logger.debug("短链接成功");
    logger.info("user_ip:",ipL);
    router.router(req,res);
}).listen(6000,"0.0.0.0");
