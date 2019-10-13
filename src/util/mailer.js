//后台常用的工具类
var fs = require('fs');
var nodemailer = require('nodemailer');

function sendMail (baseUser,basePass,userList,title,content,fn){

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        pool : true,
        host : 'smtp.qq.com',
        port : 465,
        secure : true,
        auth : {
            user : baseUser,
            pass : basePass
        }
    });

    // var transporter = nodemailer.createTransport('smtps://chrunlee@foxmail.com:jsqtbymzzyzhbdad@smtp.qq.com');

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'BUG集散地 <'+baseUser+'>', // sender address
        to: userList, // list of receivers
        subject: title, // Subject line
        html: content // html body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            throw error;
        }
        if(fn)fn(info);
    });
}
var tool = {

    /*** 
     * 发送邮件:文章回复
     ***/
    sendCommentEmail : function(baseUser,basePass,email,name,title,link){
        var emailPath = __dirname+'/../../view/mail/comment.html';
        var content = fs.readFileSync(emailPath,'utf-8');
        content = content.replace(/{{name}}/g,name);
        content = content.replace(/{{title}}/g,title);
        content = content.replace(/{{link}}/g,link);
        return new Promise((resolve,reject)=>{
            sendMail(baseUser,basePass,[email],'有人在BUG集散地中回复了您',content,function(err,info){
                resolve(info);  
            });
        });
    },
    /***
     * 发送商品内容
     **/
    sendOrderEmail : function(baseUser,basePass,email,name,html){
        var emailPath = __dirname+'/../../view/mail/order.html';
        console.log(emailPath);
        console.log(baseUser,basePass,email,name);
        var content = fs.readFileSync(emailPath,'utf-8');
        content = content.replace(/{{name}}/g,name);
        content = content.replace(/{{content}}/g,html);
        return new Promise((resolve,reject)=>{
            sendMail(baseUser,basePass,[email],'采然小店已收到您的付款，以下为商品信息！',content,function(err,info){
                resolve(info);  
            });
        });
    }
};

module.exports = tool;