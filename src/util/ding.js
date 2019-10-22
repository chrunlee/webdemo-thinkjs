let superagent = require('superagent');

function dingding( api ){
    this.api = api;
    return this;
}
dingding.prototype.send = function(data){
    let api = this.api;
    return new Promise((resolve,reject) => {
        superagent.post(api)
        .send(data)
        .end((err,res) => {
            if(err){reject(err);}
            else{
                resolve(res.text);
            }
        })
    });
}
//发送文本
dingding.prototype.sendText = function(title,content,picpath,url){
    const data = {msgtype : 'text',text : {content : content}};
    return this.send(data)
}
//发送链接
dingding.prototype.sendLink = function(title,content,picpath,url){
    const data = {msgtype : 'link',link : {text : content||'',title : title || '',picUrl : picpath || '',messageUrl : url || ''}};
    return this.send(data);
}
//发送MD
dingding.prototype.sendMd = function(title,content,picpath,url){
    const data = {msgtype : 'markdown',markdown : {title : title || '',text : content || ''}};
    console.log(data);
    return this.send(data);
}

dingding.prototype.sendCard = function(title,content,picpath,url){
    const data = {msgtype : 'feedCard',feedCard : {links : [{title : title||'',messageURL : url||'',picURL : picpath || ''}]}};
    return this.send(data);
}
module.exports = dingding;