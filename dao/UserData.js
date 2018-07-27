/**
 * Created by Administrator on 2018/4/3.
 */
var id;
var name;
var password;
var intoTime;
var score;

var User= function () {}

User.prototype.setId= function (id) {
    this.id=id;
};
User.prototype.setName= function (name) {
    this.name=name;
};
User.prototype.getName= function () {
    return this.name;
};

User.prototype.setPassword= function (password) {
    this.password=password;
};

User.prototype.setIntoTime= function (intoTime) {
    this.intoTime=intoTime;
};
User.prototype.getIntoTime= function () {
    return this.intoTime;
};
User.prototype.setScore= function (score) {
    this.score=score;
}

exports.newUser=new User();

