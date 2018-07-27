/**
 * Created by Administrator on 2018/4/16.
 */
var name;
var ready;
var cupsum;
var score_list;
var intervallist=[];
var interval;

var robot= function (name,ready,cupsum,score_list) {
    this.name=name;
    this.ready=ready;
    this.cupsum=cupsum;
    this.score_list=score_list;
}

robot.prototype.setName= function (name) {
    this.name=name;
};
robot.prototype.getName= function () {
    return this.name;
}

robot.prototype.setReady= function (ready) {
    this.ready=ready;
};
robot.prototype.setCupsum= function (cupsum) {
    this.name=name;
};
robot.prototype.setScore_List= function (n,s) {
    score_list.username=n;
    score_list.score=s;
};
robot.prototype.getScore_List= function () {
    return this.score_list;
};
robot.prototype.getIntervalList= function () {
    return intervallist;
}
robot.prototype.addScore= function (data,result,wss,roomInfo) {
    console.log("robot_class addScore");
    //(data,result,wss,roomInfo)
    setInterval(function () {

        if(data.istimeout==false){
            console.log("机器人自动加分");
            data.user_list[1].score_list.score+=1;

            result.result="ok";
            result.msg="addscore";
            result.user_datas=[data.user_list[0].score_list,data.user_list[1].score_list];
            console.log("addws_listsize:"+data.ws_list.size);
            wss.broadcast("addscore",data.ws_list,null);
        }else {
            clearInterval();
            roomInfo.istimeout=false;
        }
    },500);
};

//添加托管
robot.prototype.addTrusteeship= function (wss,result,roominfo,userlist,name,ready,cupsum,scorelist) {
    this.name=name;
    this.ready=ready;
    this.cupsum=cupsum;
    this.score_list=scorelist;
    interval= setInterval(function () {

        if(roominfo.istimeout==false){
            console.log("托管机器人自动加分");
            userlist.score_list.score+=1;
            result.result="ok";
            result.msg="addscore";
            result.user_datas=[roominfo.user_list[0].score_list,roominfo.user_list[1].score_list];
            console.log("addws_listsize:"+roominfo.ws_list.length);
            wss.broadcast("addscore",roominfo.ws_list,null,result);
        }else {
            clearInterval(interval);
            roominfo.istimeout=false;
        }
    },500);
    console.log("push interval");
    intervallist.push({"name":name,"interval":interval});
};
//取消托管

robot.prototype.cancelTrusteeship= function (name,trusteeship,callback) {
    for(var z=0;z<trusteeship.getIntervalList().length;z++){
        if(trusteeship.getIntervalList()[z].name==name){
            console.log("停止机器人托管");
            clearInterval(trusteeship.getIntervalList()[z].interval);
            callback();
            break;
        }
    }
};
exports.robot=robot;





