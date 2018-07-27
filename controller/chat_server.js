/**
 * Created by Administrator on 2018/3/20.
 */
/**
 * Created by Administrator on 2018/3/20.
 */
const WebSocket=require('ws');
const router=require('./router.js');
const db=require('../models/db');
const robot_factory=require('../models/robot');
//---------------------日志-------------------------------------
var log4js=require('log4js');
var log4js_config=require('../models/log4js_config.json');
log4js.configure(log4js_config);
var logger=log4js.getLogger("cheese");
//---------------------------------------------------------------


exports.connect_chat_room= function () {

    const wss=new WebSocket.Server({
        port:3000,
        verifyClient:socketVerify
    });
    function socketVerify(info){
        console.log(info.origin);
        console.log(info.req.url);
        return true;
    }
    //全局变量的声明
    var roomid,room,user_list,roomInfo,result,gameInfo,score_list,name_score,name_score_1,isready,_0,_1,ws_list,room_count;
    var istimeout=false;
    var time;
    var diconnection_pool=[];

    //托管的数组
    var trusteeship=[];
    //全局变量数据初始化
    function initData(){
        roomid=0;
        room={};//房间信息
        room_count=0;
        user_list=[];//用户数组
        roomInfo=[];//room数组
        result={//向客户端发送的消息
            "result":"",
            "msg":"",
            "user_datas":[],
            "roomid":""
        };
        //游戏的开始时间，和游戏的时长（倒计时10秒）
        gameInfo={
            "startTime":"",
            "endTime":"",
            "times":10,
        }
        score_list=[];
        //初始化1用户的分数；
        name_score={
            "name":"",
            "score":0
        }
        //初始化2用户的分数
        name_score_1={
            "name":"",
            "score":0
        }
        //验证两个是否都准备
        isready=true;
        //判断客户端倒计时进入游戏阶段
        _0=0;
        _1=0;
        //添加同一个房间的客户端标志
        ws_list=[];
    }
    //初始化全局数据
    initData();

    /**
     * mag:
     * 0  获取用户名
     *
     */
    //广播
    /**
     * @param tag :操作标志
     * @param content ：某房间内存放的用户的ws客户端对象
     * @param chat_msg ：记录用户聊天发送的信息
     * @param roomInfo：某一个房间的信息
     */
    wss.broadcast= function broadcast(tag,content,chat_msg,roomInfo,callresult) {
        wss.clients.forEach(function each(client) {


            //游戏开始，监听游戏十秒钟限时，并提醒房间内客户端时间已到
            if(tag=="game"){
                /*heard(tag,roomInfo, function () {
                    roomInfo.ws_list[0].send(JSON.stringify(result));
                    roomInfo.ws_list[1].send(JSON.stringify(result));
                });*/
                console.log("房间人数："+roomInfo.ws_list.length);

                for(var i=0;i<roomInfo.ws_list.length;i++){
                    if(client==roomInfo.ws_list[i]){

                        heard(tag,roomInfo, function () {
                            roomInfo.ws_list[0].send(JSON.stringify(result));
                            roomInfo.ws_list[1].send(JSON.stringify(result));
                        });
                    }
                }
            //给房间内的人广播聊天信息
            }else if(tag=="chat"){
                console.log("intochat broadcast");
                console.log("contentsize:"+content.length);
                for(var i=0;i<content.length;i++){
                    console.log("intocontent");
                    console.log(client==content[0]);
                    console.log(client==content[1]);
                    if(client==content[i]){
                        client.send(JSON.stringify(chat_msg));
                    }
                }
            //通知客户端匹配成功
            }else if(tag=="pipei") {
                for(var i=0;i<content.length;i++){
                    if(client==content[i]){
                        client.send(JSON.stringify(result));
                    }
                }
            //通知客户端房间因某人退出而解散
            }else if(tag=="exit"){
                for(var i=0;i<content.length;i++){
                    if(client==content[i]){
                        result.result="ok";
                        result.msg="exit";
                        client.send(JSON.stringify(result));
                    }
                }
            //加分等操作的广播
            } else{
                //只在同一个房间内广播
                if(callresult!=null){
                    for(var i=0;i<content.length;i++){
                        if(client==content[i]){
                            client.send(JSON.stringify(callresult));
                        }
                    }
                }else {
                    console.log("contentsize:"+content.length);
                    for(var i=0;i<content.length;i++){
                        if(client==content[i]){
                            client.send(JSON.stringify(result));
                        }
                    }
                }

            }
            //游戏开始监听计时（10秒）
            /**
             *
             * @param flag :用户操作标记
             * @param roomInfo :某一个房间的信息
             * @param callback ：时间到回调通知
             */
            function heard(flag,roomInfo,callback){
                room=roomInfo;
                setTimeout(function () {
                    roomInfo=room;
                    var nowTime = new Date().getTime();
                    if (nowTime - roomInfo.start_time > 10000) {
                        console.log("roomInfo.startTime",roomInfo.start_time);
                        result.result = "ok";
                        result.msg = "时间已到";
                        result.user_datas = [roomInfo.user_list[0].score_list, roomInfo.user_list[1].score_list];
                        roomInfo.istimeout=true;
                        //更新用户的奖杯数
                        if(roomInfo.user_list[0].score_list.score>roomInfo.user_list[1].score_list.score){
                            console.log("用户2大于用户1");
                            //更新数据库的奖杯数
                            getUserByName(roomInfo,roomInfo.user_list[0].score_list);
                        }else {
                            console.log("用户1大于用户2");
                            getUserByName(roomInfo,roomInfo.user_list[1].score_list);
                        }
                        console.log("时间已到");
                        console.log("时间已到有人数："+roomInfo.ws_list.length);
                        callback();
                        //roomInfo.ws_list=[];

                    }
                },1000*11);
            }
        });
    };
    //更新数据库奖杯数
    /**
     * @param name_json 胜利用户的分数信息
     */
    function getUserByName(roomInfo,name_json){
        db.getUserByName(name_json.name, function (err,result_user) {
            if(result_user!=""){
                cup=result_user[0].cupsum;
                cup=cup+5;
                db.updateCupSum({"name":name_json.name,"cupsum":cup}, function (err,value) {
                    if(value!=""){
                        console.log("数据修改成功");
                    }
                    roomInfo.user_list=[];
                });
            }
        });
    }

    //接收和处理服务器发生的未知错误
    process.on("uncaughtException",function(err){
       console.log("服务器异常"+err);
    });
    //判断是否达到匹配成功的条件，如果长时间无法匹配成功，会自动匹配到机器人
    function conform_matching_condition(user_list,roomInfo,ws_list,result){
        if(user_list.length==2){
            console.log("匹配成功："+user_list);
            room_count=room_count+1;
            room={"roomid":room_count,"user_list":user_list,"ws_list":ws_list,"start_time":0};
            roomInfo.push(room);
            user_list=[];
            ws_list=[];
            console.log("匹配成功完成后："+user_list);
            //根据用户名确定在哪个房间
            for(var i=0;i<roomInfo.length;i++){
                for(var j=0;j<roomInfo[i].user_list.length;j++){
                    if(roomInfo[i].user_list[j].name==json_value.name){
                        result.result="ok";
                        result.msg="0";//匹配成功
                        result.user_datas=room.user_list;
                        result.roomid=room.roomid;
                        wss.broadcast("pipei",roomInfo[i].ws_list,null);
                        break;
                    }
                }
            }
        }else {
            setTimeout(function () {
                if(user_list.length==1){
                    var user={};
                    user={"name":"robot","ready":"0","cupsum":0,"score_list":{}};
                    user_list.push(user);
                    room_count=room_count+1;
                    room={"roomid":room_count,"user_list":user_list,"ws_list":ws_list,"start_time":0};
                    for(var i=0;i<user_list.length;i++){
                        console.log("匹配完成："+user_list[i].name);
                        console.log("匹配完成："+user_list[i].ready);
                    }
                    roomInfo.push(room);
                    user_list=[];
                    ws_list=[];
                    result.result="ok";
                    result.msg="0";//匹配成功
                    result.user_datas=room.user_list;
                    result.roomid=room.roomid;
                    wss.broadcast("pipei",roomInfo[room_count-1].ws_list,null);
                }
            },1000*10)
        }
    }
    //更改用户准备状态
    function change_user_ready_state(data,json_value){
        for(var i=0;i<data.user_list.length;i++){
            if(data.user_list[i].name==json_value.name){
                if(data.user_list[i].ready=="0"){
                    data.user_list[i].ready="1"
                }else {
                    data.user_list[i].ready="0"
                }
            }else if(data.user_list[i].name=="robot") {
                console.log("ready_robot.name:"+data.user_list[i].name);
                console.log("ready_robot.ready:"+data.user_list[i].ready);
                data.user_list[i].ready="1"
            }
        }
    }
    //判断房间用户是否都准备
    function judge_all_ready(data,isready,result){
        for(var i=0;i<data.user_list.length;i++){
            if(data.user_list[i].ready=="0"){
                isready=false;
            }
        }
        if(isready==true){
            result.result="ok";
            result.msg="two";
            result.user_datas=data.user_list;
            wss.broadcast("ready",data.ws_list,null,null);
        }else {
            result.result="ok";
            result.msg="one";
            result.user_datas=data.user_list;
            wss.broadcast("only one ready",data.ws_list,null,null);
        }
    }
    //初始化
    wss.on('connection', function (ws) {
        console.log("已连接");
        if(diconnection_pool.length>0){
            console.log("disconnection_pool:"+diconnection_pool[0].client);
        }
        result.result="ok";
        result.msg="connect";
        ws.send(JSON.stringify(result));
        //发送信息
        ws.on('message', function (jsonStr,flags) {
            var json_string=jsonStr;
            var json_value=JSON.parse(json_string);
            console.log("json_string:"+json_string);

            //匹配
            if(json_value.tag=="pipei"){
                //保存客户端对象的信息，广播时来分辨给同一个房间的客户端广播
                ws_list.push(ws);
                //暂时存储用户的信息
                var user={};
                /**
                 * @type {{name: *, ready: string, cupsum: number, score_list: {}}}
                 *          用户名，准备状态，奖杯数，分数{名称，分数}
                 */
                user={"name":json_value.name,"ready":"0","cupsum":0,"score_list":{}};
                db.getUserByName(json_value.name, function (err,result_user) {
                    if(result_user!=""){
                        user.cupsum=result_user[0].cupsum;
                        user_list.push(user);
                        console.log("user_list.size:"+user_list.length);
                        //conform_matching_condition(user_list,roomInfo,ws_list,result);
                        if(user_list.length==2){
                            console.log("匹配成功："+user_list);
                            room_count=room_count+1;
                            room={"roomid":room_count,"user_list":user_list,"ws_list":ws_list,"start_time":0,"istimeout":istimeout};
                            roomInfo.push(room);
                            user_list=[];
                            ws_list=[];
                            console.log("匹配成功完成后："+user_list);
                            //根据用户名确定在哪个房间
                            for(var i=0;i<roomInfo.length;i++){
                                for(var j=0;j<roomInfo[i].user_list.length;j++){
                                    if(roomInfo[i].user_list[j].name==json_value.name){
                                        result.result="ok";
                                        result.msg="0";//匹配成功
                                        result.user_datas=room.user_list;
                                        result.roomid=room.roomid;
                                        wss.broadcast("pipei",roomInfo[i].ws_list,null);
                                        break;
                                    }
                                }
                            }
                            clearTimeout(time);
                            console.log("有玩家进来，停止监听10秒");


                        }else {
                            console.log("监听是否10秒没有其他人匹配");
                            time=setTimeout(function () {
                                console.log("setimeout已停止");
                                if(user_list.length==1){
                                    var robot_user=new robot_factory.robot("robot",0,0,{});
                                    /* var user={};
                                     user={"name":"robot","ready":"0","cupsum":0,"score_list":{}};*/
                                    user_list.push(robot_user);
                                    room_count=room_count+1;
                                    room={"roomid":room_count,"user_list":user_list,"ws_list":ws_list,"start_time":0,"istimeout":istimeout};
                                    for(var i=0;i<user_list.length;i++){
                                        console.log("匹配完成："+user_list[i].name);
                                        console.log("匹配完成："+user_list[i].ready);
                                    }
                                    roomInfo.push(room);
                                    user_list=[];
                                    ws_list=[];
                                    result.result="ok";
                                    result.msg="0";//匹配成功
                                    result.user_datas=room.user_list;
                                    result.roomid=room.roomid;
                                    wss.broadcast("pipei",roomInfo[room_count-1].ws_list,null);
                                }
                            },1000*10);
                        }
                    }
                });
            }else if(json_value.tag=="connect"){
                console.log("connect:"+json_value.name);
                //用户重连
                for(var i=0;i<diconnection_pool.length;i++){
                    if(diconnection_pool[i].client==json_value.name){
                        console.log("此用户处于重连状态");
                        var result_reconnect={
                            "result":"ok",
                            "msg":"reconnect",
                            "roomcontent":[]
                        }
                        for(var i=0;i<roomInfo.length;i++){
                            for(var j=0;j<roomInfo[i].user_list.length;j++){
                                if(roomInfo[i].user_list[j].name==json_value.name)
                                {
                                    console.log("找到了重连用户的房间号:"+roomInfo[i].user_list[0].name);
                                    result_reconnect.roomcontent=roomInfo[i].user_list;
                                    console.log("roomcontent:"+result_reconnect.roomcontent);
                                    console.log("send"+JSON.stringify(result_reconnect));
                                    ws.send(JSON.stringify(result_reconnect));
                                    roomInfo[i].ws_list.push(ws);
                                    console.log("重连后的ws:"+ws);
                                    break;
                                }
                            }
                        }
                    }
                }
            }else if(json_value.tag=="reconnect"){
                for(var i=0;i<diconnection_pool.length;i++){
                    if(diconnection_pool[i].client==json_value.name){
                        console.log("此用户处于重连状态");
                        diconnection_pool.splice(i,1);
                        for(var j=0;j<trusteeship.length;j++){
                            if(trusteeship[j].getName()==json_value.name){
                                console.log("开始接管机器人");
                                trusteeship[j].cancelTrusteeship(json_value.name,trusteeship[j], function () {
                                    findRoom(roomInfo,json_value, function (err,room) {
                                       /* room.ws_list.push(ws);*/
                                        console.log("成功接管");
                                    });
                                });
                                break;
                            }
                        }
                    }
                }
            }else if(json_value.tag=="ready"){//准备
                findRoom(roomInfo,json_value, function (err,data) {//判断是哪个房间

                    //修改用户准备状态
                    change_user_ready_state(data,json_value);
                    //判断房间用户是否都准备
                    judge_all_ready(data,isready,result);

                });
            }else if(json_value.tag=="start_0"){
                var isRobot=false;
                var isRobot_tag;
                console.log("start_0_roominfo:"+roomInfo.length);
                findRoom(roomInfo,json_value, function (err,data) {

                    //判断房间中是否存在机器人用户
                    for(var i=0;i<data.user_list.length;i++){
                        if(data.user_list[i].name=="robot"){
                            console.log("robot_start_0");
                            isRobot=true;
                            isRobot_tag=i;
                            break;
                        }
                    }
                    console.log("isRobot",isRobot);
                    if(isRobot==false){
                        console.log("start_0");
                        name_score.score=0;
                        name_score_1.score=0;
                        data.user_list[0].score_list.score=name_score.score;
                        data.user_list[1].score_list.score=name_score_1.score;
                        for(var i=0;i<data.user_list.length;i++){
                            if(data.user_list[i].name==json_value.name){
                                data.user_list[i].score_list.name=json_value.name;
                                break;
                            }
                        }
                        _0=1;
                        if(_0==1&&_1==1){
                            console.log("_0=1 _1=1");
                            data.start_time=new Date().getTime();
                            wss.broadcast("game",data.ws_list,null,data);
                            _0=0;
                            _1=0;
                        }
                    }else {
                        console.log("robot_start");
                        name_score.score=0;
                        name_score_1.score=0;
                        data.start_time=new Date().getTime();
                        data.user_list[0].score_list.score=name_score.score;
                        data.user_list[1].score_list.score=name_score_1.score;
                        data.user_list[0].score_list.name=json_value.name;
                        data.user_list[1].score_list.name=data.user_list[isRobot_tag].name;
                        console.log("robot_start_game:",data.ws_list.length);
                        wss.broadcast("game",data.ws_list,null,data);
                        var r=new robot_factory.robot();
                        r.addScore(data,result,wss,roomInfo);
                    }

                });

            }else if(json_value.tag=="start_1"){
                var isRobot=false;
                var isRobot_tag;
                findRoom(roomInfo,json_value, function (err,data) {
                    for(var i=0;i<data.user_list.length;i++){
                        if(data.user_list[i].name=="robot"){
                            isRobot=true;
                            isRobot_tag=i;
                            break;
                        }
                    }
                    if(isRobot==false) {
                        name_score.score = 0;
                        name_score_1.score = 0;
                        data.user_list[0].score_list.score=name_score.score;
                        data.user_list[1].score_list.score=name_score_1.score;
                        for(var i=0;i<data.user_list.length;i++){
                            if(data.user_list[i].name==json_value.name){
                                data.user_list[i].score_list.name=json_value.name;
                                break;
                            }
                        }
                        console.log("start_1");
                        _1 = 1;
                        if (_0 == 1 && _1 == 1) {
                            data.start_time=new Date().getTime();
                            console.log("_0=1 _1=1");
                            wss.broadcast("game", data.ws_list, null,data);
                            _0 = 0;
                            _1 = 0;
                        }
                    }else {
                        name_score.score=0;
                        name_score_1.score=0;
                        console.log("start_1");
                        _1=1;

                        data.user_list[0].score_list.name=data.user_list[isRobot_tag].name;
                        data.user_list[1].score_list.name=json_value.name;
                        _1=1;
                        _0=1;
                        wss.broadcast("game",data.ws_list,null);
                        _0=0;
                        _1=0;
                        //机器人自动加分
                        setInterval(function () {
                            if(istimeout==false){
                                data.user_list[0].score_list.score+=1;
                                result.result="ok";
                                result.msg="addscore";
                                result.user_datas=[data.user_list[0].score_list,data.user_list[1].score_list];
                                console.log("addws_listsize:"+data.ws_list.size);
                                wss.broadcast("addscore",data.ws_list,null);
                            }else {
                                clearInterval(this);
                            }
                        },1000*2);
                    }
                });

            }else if(json_value.tag=="addscore"){
                findRoom(roomInfo,json_value, function (err,data) {
                    for(var i=0;i<data.user_list.length;i++){
                        if(json_value.name==data.user_list[i].score_list.name){
                            data.user_list[i].score_list.score+=1;
                        }
                    }
                    result.result="ok";
                    result.msg="addscore";
                    result.user_datas=[data.user_list[0].score_list,data.user_list[1].score_list];
                    console.log("addws_listsize:"+data.ws_list.size);
                    wss.broadcast("addscore",data.ws_list,null,data);
                });
            }else if(json_value.tag=="chat"){
                findRoom(roomInfo,json_value, function (err,data) {
                    var result_chat={
                        "result":"ok",
                        "msg":"chat",
                        "message":""
                    }
                    console.log("chat_room:"+data.ws_list);
                    result_chat.message=json_value.name+":"+json_value.msg;
                    console.log("message:"+json_value.msg);
                    wss.broadcast("chat",data.ws_list,result_chat);
                });
            }else if(json_value.tag=="exit"){
                findRoom(roomInfo,json_value, function (err,data) {
                    wss.broadcast("exit",data.ws_list,null);
                    for(var i=0;i<roomInfo.length;i++){
                        if(roomInfo[i].roomid==json_value.roomid){
                            roomInfo.splice(i,1);
                            break;
                        }
                    }
                    console.log("close:"+roomInfo.length);
                });
            }
        });


        //根据房间号获取相对应房间信息
        function findRoom(roominfo,json,callback){
            console.log("findRoom_length:"+roominfo.length);
            for(var i=0;i<roominfo.length;i++){
                if(roominfo[i].roomid==json.roomid){
                    console.log(roominfo[i].roomid);
                    console.log(json.roomid);
                    callback(null,roominfo[i]);
                    break;
                }
            }
        }

        //退出聊天
        ws.on('close', function () {
            for(var i=0;i<roomInfo.length;i++){
                for(var j=0;j<roomInfo[i].ws_list.length;j++){
                    if(ws==roomInfo[i].ws_list[j]){
                        diconnection_pool.push({"client":roomInfo[i].user_list[j].name});
                        console.log(roomInfo[i].user_list[j].name+":"+"异常断线");
                        console.log("机器人开始托管");
                        var robot_tuoguan=new robot_factory.robot();
                        roomInfo[i].ws_list.splice(j,1);
                        console.log("接管后人数："+roomInfo[i].ws_list.length);
                        robot_tuoguan.addTrusteeship(wss,result,roomInfo[i],roomInfo[i].user_list[j],roomInfo[i].user_list[j].name,1,roomInfo[i].user_list[j].cupsum,roomInfo[i].user_list[j].score_list);
                        trusteeship.push(robot_tuoguan);
                        ws.close();
                        console.log(robot_tuoguan);
                        break;
                    }
                }
            }
        });
    });
};


