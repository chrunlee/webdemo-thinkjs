let superagent = require('superagent');

module.exports =function send (api,text){
    var superagent = require('superagent');
    const data = {msgtype : 'text',text : {content : ''}};
    data.text.content = text;
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