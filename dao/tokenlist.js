/**
 * Created by Administrator on 2018/4/16.
 */
var token_list=[];
var TokenList= function () {

};

TokenList.prototype.setToken= function (token) {
    token_list.push(token);
};
TokenList.prototype.getTokenList= function () {
    return token_list;
};

exports.Tokenlist=TokenList;