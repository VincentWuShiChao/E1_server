/**
 * Created by Administrator on 2018/4/3.
 */
var url=require("url");
var https=require('https');
var querystring=require('querystring');
var url=require('url');
var util=require("util");
var t=require('../dao/token.js');
var db=require('../models/db');
var TokenList=require('../dao/tokenlist');
var token=t.newToken;
var count=1;
//var TokenList=[];
var tokenlist=new TokenList.Tokenlist();
var first_login=true;
exports.router= function (req,res) {
    console.log(req.url);
    res=header(res);
    processData(req,res);
};

function listen(){
    setInterval(function () {
        var now_time=new Date().getTime();
        console.log("now_time:"+now_time);
        for(var i=0;i<tokenlist.getTokenList().length;i++){
            var old_time=tokenlist.getTokenList()[i].userData.getIntoTime();
            console.log("old_time:"+old_time);
            var validTime=tokenlist.getTokenList()[i].validTimes;
            console.log("validTime:"+validTime);
            if(now_time-old_time>=validTime){
                console.log("删除元素");
                tokenlist.getTokenList().splice(i,1);
                console.log(tokenlist.getTokenList().toString());
            }
        }
        console.log("发生剔除");
    },1000*60*5);
}

//对客户端相关请求的处理
function processData(req,res){
    var body="";
    req.on('data', function (chunk) {
        body+=chunk;
    });
    req.on('end', function () {
        body=querystring.parse(body);
        //console.log("body:",body);
        switch (body.tag){
            case "login":
                login(res,body.name,body.password);
                break;
            case "regist":
                regist(res,body.name,body.password);
                break;
            case "start":
                start(res,body.name,body.password);
                break;
            case "addscore":
                addscore(res,body.name,body.password);
                break;
            case "rank":
                rank(res,body.name);
                break;
            case "fastlogin":
                fastlogin(res,body.name,body.password);
                break;
            case "qqlog":
                console.log(body.name);
                openid=JSON.parse(body.name).openid;
                access_token=JSON.parse(body.name).access_token;
                console.log(openid);
                https.get('https://graph.qq.com/user/get_user_info?access_token=\"'+access_token+'\"&oauth_consumer_key=\"7ryq5ugg2sNG0fi4\"&openid=\"'+openid+'\"', function(res) {
                    console.log('statusCode:', res.statusCode);
                    res.on('data', function(d) {
                        console.log(d.toString());
                    });
                }).on('error', function(e) {
                    console.error(e);
                });
                break;
        }
    });
}
//快速登录
function fastlogin(res,mac,password){
    var result={
        "result":"",
        "msg":""
    }
    var name=mac;
    console.log("mac:"+mac);
    db.getUserByName(name, function (err,result_user) {
        if(result_user!=""){
            console.log("第二次登陆");
            result.result="ok";
            result.msg="快速登录成功";
            var json_value=jsonToString(result);
            res.write(json_value);
            res.end();
        }else {
            console.log("第一次快登陆");
            db.addUser({"name":mac,"password":password}, function (err,result_regist) {
                if(result_regist!=""){
                    result.result="ok";
                    result.msg="快速登录成功";
                }else {
                    result.result="error";
                    result.msg="注册失败";
                }
                var json_value=jsonToString(result);
                res.write(json_value);
                res.end();
            });
        }
    });

}
//获取排行榜
function rank(res,name){

    var result={
        "result":"",
        "msg":"",
        "rank_list":[]
    }
    verify(name, function (err,result_1) {
        if(result_1==1){
            db.getRank(function (err,result_rank) {
                if(result_rank!=""){
                    //刷新操作时间
                    for(var i=0;i<TokenList.length;i++){
                        if(TokenList[i].userData.getName()==name){
                            var now=new Date().getTime();
                            TokenList[i].userData.setIntoTime(now);
                            console.log("new_userintotime:"+TokenList[i].userData.getIntoTime());
                        }
                    }
                    result.result="ok";
                    result.msg="刷新排行榜成功";
                    for(var i=0;i<result_rank.length;i++){
                        result.rank_list.push({"name":result_rank[i].name,"score":result_rank[i].score});
                    }
                    var json_value=jsonToString(result);
                    res.write(json_value);
                    res.end();
                }else {
                    result.result="error";
                    result.msg="还没有任何记录";
                    var json_value=jsonToString(result);
                    res.write(json_value);
                    res.end();
                }
            })
        }else {
            result.result="error";
            result.msg="非法用户";
            var json_value=jsonToString(result);
            res.write(json_value);
            res.end();
        }
    });


}

//pve模式的加分
function addscore(res,name,score){
    var result={
        "result":"",
        "msg":"",
    };
    verify(name, function (err,result_1) {
        if(result_1==1){
            db.getUserScore(name, function (err,result_score) {
                //刷新操作时间
                for(var i=0;i<TokenList.length;i++){
                    if(TokenList[i].userData.getName()==name){
                        var now=new Date().getTime();
                        TokenList[i].userData.setIntoTime(now);
                        console.log("new_userintotime:"+TokenList[i].userData.getIntoTime());
                    }
                }
                if(result_score[0].score!=0){
                    if(result_score[0].score<score){
                        db.updateScore({"name":name,"score":score}, function (err,result_update) {
                            if(result_update!=""){
                                result.result="ok";
                                result.msg="最高分："+score;
                                var json_value=jsonToString(result);
                                res.write(json_value);
                                res.end();
                            }
                        });
                    }else {
                        result.result="ok";
                        result.msg="最高分："+result_score[0].score;
                        var json_value=jsonToString(result);
                        res.write(json_value);
                        res.end();
                    }

                }else {
                    db.updateScore({"name":name,"score":score}, function (err,result_update) {
                        if(result_update!=""){
                            result.result="ok";
                            result.msg="最高分："+score;
                            var json_value=jsonToString(result);
                            res.write(json_value);
                            res.end();
                        }
                    });
                }
            });
        }else {
            result.result="error";
            result.msg="非法用户";
            var json_value=jsonToString(result);
            res.write(json_value);
            res.end();
        }

    });

}
//判断用户是否登录的标志
var islogin=false;
function start(res,name,safeCode){
    var result={
        "result":"",
        "msg":"",
    };
    verify(name, function (err,result_1) {
        if(result_1==1){
            result.result="ok";
            result.msg="正常用户";
            //刷新操作时间
            for(var i=0;i<tokenlist.getTokenList().length;i++){
                if(tokenlist.getTokenList()[i].userData.getName()==name){
                    var now=new Date().getTime();
                    tokenlist.getTokenList()[i].userData.setIntoTime(now);
                    console.log("new_userintotime:"+tokenlist.getTokenList()[i].userData.getIntoTime());
                }
            }
        }else {
            result.result="error";
            result.msg="非法用户";
        }
        var json_value=jsonToString(result);
        res.write(json_value);
        res.end();
    });
}
//验证用户操作是否为非法用户
function verify(name_data,callback){
    var number=0;
    for(var i=0;i<tokenlist.getTokenList().length;i++){
        if(tokenlist.getTokenList()[i].token_name==name_data){//&&TokenList[i].safeCode==safeCode_data
            number=1;
            break;
        }
    }
    callback(null,number);
}
//注册
function regist(res,name,password){
    var result={
        "result":"",
        "msg":"",
    }
    db.getUserByName(name, function (err,result_user) {
        if(result_user==""){
            db.addUser({"name":name,"password":password}, function (err,result_regist) {
                if(result_regist!=""){
                    result.result="ok";
                    result.msg="注册成功";
                }else {
                    result.result="error";
                    result.msg="注册失败";
                }
                var json_value=jsonToString(result);
                res.write(json_value);
                res.end();
            });
        }else {
            result.result="error";
            result.msg="用户名已存在";
            var json_value=jsonToString(result);
            res.write(json_value);
            res.end();
        }
    });

}

//判断用户是否已经登录
function userIsLogin(flag,tokenlist,name,callback){
    console.log("userislogin");
    for(var i=0;i<tokenlist.length;i++){
        if(tokenlist[i].userData.getName()==name){
            flag=true;
            break;
        }
    }
    callback(null,flag);

}

//用户登录
function login(res,name,password){
    var result={
        "result":"",
        "msg":"",
        "userData":""
    };
    userIsLogin(islogin,tokenlist,name, function (err,data) {
        console.log(data);
        /*if(data==true){
            console.log("data");
            result.result="error";
            result.msg="用户已登录";
            var json_value=jsonToString(result);
            res.write(json_value);
            res.end();
        }else {
            db.getUserByName(name, function (err,result_user) {

                if(result_user!=""){
                    if(result_user[0].password==password){
                        result.result="ok";
                        result.msg="信息正确";
                        findFirstLogin(first_login,name,function (err,result_tag) {
                            if(result_tag==true){
                                token.setName(name);
                                token.createToken(name, function (err,result_token) {
                                    console.log(result_token);
                                    token.setUserData(count++,name,password,new Date().getTime(),result_user[0].score);
                                    var json_token={
                                        "token_name":token.getName(),
                                        "userData":token.getUserData(),
                                        "validTimes":token.getValidTimes(),
                                        "safeCode":result_token
                                    }
                                    TokenList.push(json_token);
                                    console.log(token);
                                    console.log("TokenList:"+TokenList);
                                    result.userData=json_token;
                                });
                            }else {
                                for(var i=0;i<TokenList.length;i++){
                                    if(TokenList[i].token_name==name){
                                        result.userData=TokenList[i];
                                        break;
                                    }
                                }
                            }
                            //打开用户是否长期未操作的监听器
                            listen();
                        });
                    }else {
                        result.result="error";
                        result.msg="密码错误";
                    }
                }else {
                    result.result="error";
                    result.msg="用户不存在";
                }
                var json_value=jsonToString(result);
                res.write(json_value);
                res.end();
            });
        }*/
        db.getUserByName(name, function (err,result_user) {

            if(result_user!=""){
                if(result_user[0].password==password){
                    result.result="ok";
                    result.msg="信息正确";
                    findFirstLogin(first_login,name,function (err,result_tag) {
                        if(result_tag==true){
                            token.setName(name);
                            token.createToken(name, function (err,result_token) {
                                console.log(result_token);
                                token.setUserData(count++,name,password,new Date().getTime(),result_user[0].score);
                                var json_token={
                                    "token_name":token.getName(),
                                    "userData":token.getUserData(),
                                    "validTimes":token.getValidTimes(),
                                    "safeCode":result_token
                                }
                                //TokenList.push(json_token);
                                tokenlist.setToken(json_token);
                                console.log("tokenlist:"+token.getName());
                                //console.log("TokenList:"+TokenList);
                                result.userData=json_token;
                            });
                        }else {
                            /*for(var i=0;i<TokenList.length;i++){
                                if(TokenList[i].token_name==name){
                                    result.userData=TokenList[i];
                                    break;
                                }
                            }*/
                            for(var i=0;i<tokenlist.getTokenList().length;i++){
                                if(tokenlist.getTokenList()[i].token_name==name){
                                    result.userData=tokenlist.getTokenList()[i];
                                    break;
                                }
                            }
                        }
                        //打开用户是否长期未操作的监听器
                        listen();
                    });
                }else {
                    result.result="error";
                    result.msg="密码错误";
                }
            }else {
                result.result="error";
                result.msg="用户不存在";
            }
            var json_value=jsonToString(result);
            res.write(json_value);
            res.end();
        });
    });


}
function findFirstLogin(flag,username,callback){
    for(var i=0;i<TokenList.length;i++){
        if(TokenList[i].token_name==username){
            console.log("第二次登陆"+TokenList[i].userData);
            flag=false;
            break;
        }
    }
    callback(null,flag);
}

function jsonToString(result){
    json_string=JSON.stringify(result);
    return json_string;
}
function header(res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    return res;
}