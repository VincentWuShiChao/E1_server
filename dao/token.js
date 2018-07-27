/**
 * Created by Administrator on 2018/4/3.
 */
var UserUitls=require('./UserData.js');
const CODINGTYPE='base64';
var username;
var validTimes=60*1000*4;
var userData=UserUitls.newUser;
//构造函数
var Token=function(){
};
Token.prototype.setName= function (name) {
    this.username=name;
};
Token.prototype.getName= function () {
    return this.username;
};
Token.prototype.getValidTimes= function () {
    return validTimes;
}
Token.prototype.createToken= function (data,callback) {
    data=data+"&time="+new Date().getTime();
    var buf=new Buffer(data);
    var token_string=buf.toString(CODINGTYPE);
    callback(null,token_string);
};
Token.prototype.setUserData= function (id,name,password,intoTime,score) {
    userData.setId(id);
    userData.setName(name);
    userData.setPassword(password);
    userData.setIntoTime(intoTime);
    userData.setScore(score);
}
Token.prototype.decodeToken= function (data,callback) {
    var buf=new Buffer(data,CODINGTYPE);
    var decode_string=buf.toString();
    callback(null,decode_string);
};

Token.prototype.getUserData= function () {
    return userData;
};

exports.newToken=new Token();