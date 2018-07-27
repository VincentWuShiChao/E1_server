/**
 * Created by Administrator on 2018/4/3.
 */
var mysqlconnect=require('./mysqlconnect');


//获得所有的用户信息
exports.getAllUser= function (callback) {
    var sql="select * from user";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback("查询失败",null);
        }
        callback(null,sql_result);
    })
};
//根据用户名获取用户信息
exports.getUserByName= function (data,callback) {
    var sql="select * from user where name='"+data+"'";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        console.log("getUserByName:sql_result:"+sql_result);
        callback(null,sql_result);
    })
};
//获取用户的分数
exports.getUserScore= function (data,callback) {
    var sql="select * from user where name='"+data+"'";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    });
};
//更新分数
exports.updateScore= function (data,callback) {
    var sql="update user set score="+data.score+" where name='"+data.name+"'";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    })

}
//更新用户的奖杯数
exports.updateCupSum= function (data,callback) {
    var sql="update user set cupsum="+data.cupsum+" where name='"+data.name+"'";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    })

}
//获取数据库分数排行
exports.getRank= function (callback) {
    var sql="select * from user order by score desc limit 10";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    })
}
//注册用户
exports.addUser= function (data,callback) {
    console.log("data.name:"+data.name);
    var sql="insert into user(name,password) values('"+data.name+"','"+data.password+"')";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            console.log(err);
        }
        callback(null,sql_result);
    })
}
