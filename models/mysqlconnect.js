/**
 * Created by Administrator on 2018/3/13.
 */
/**
 * Created by Administrator on 2018/3/13.
 */
var mysql=require('mysql');

var conn_pool=mysql.createPool({
    host:"127.0.0.1" ,
    port:3306,
    database:"e1_sql",
    user:"root",
    password:"03251222yxn"
});

function mysql_exce(sql,callback){
    conn_pool.getConnection(function (err,conn) {
        if(err){
            if(callback){
                callback(err,null,null);
            }
            return;
        }
        conn.query(sql, function (sql_err,sql_result,fields_desic) {
            if(sql_err){
                console.log("数据库发生错误");
                callback(sql_err,null,null);
                conn.end();
                return;
            }
            console.log("query:sql_result:"+sql_result);
            callback(null,sql_result,fields_desic);
            conn.release();
        });

    });
}
exports.mysql_exce=mysql_exce;
