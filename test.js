/**
 * Created by Administrator on 2018/4/3.
 */
var db=require('./models/db');

db.getUserByName("9", function (err,result) {
    if(result==''){
        console.log("用户不存在");
    }else {
        console.log(result);
    }
});