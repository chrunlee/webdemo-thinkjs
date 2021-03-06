/***
 * 将文件上传到七牛云存储上进行管理。
 ***/
let qiniu = require('qiniu');
let path = require('path');
//文件保存。
function saveFile(ak,sk,scope,filePath,prefix,basename,extname){
    return new Promise(function(resolve,reject){
        let mac = new qiniu.auth.digest.Mac(ak, sk);
        let options = {
          scope: scope+(basename ? (':'+basename) : '')
        };
        let putPolicy = new qiniu.rs.PutPolicy(options);
        let uploadToken=putPolicy.uploadToken(mac);
        //上传
        let config = new qiniu.conf.Config();
        // 空间对应的机房
        config.zone = qiniu.zone.Zone_z0;
        let formUploader = new qiniu.form_up.FormUploader(config);
        let putExtra = new qiniu.form_up.PutExtra();
        // 文件上传
        let fileName = basename || (prefix+(+new Date())+'-'+(Math.floor(Math.random()*10000))+(extname||path.extname(filePath)));
        //上传之前先删除

        formUploader.putFile(uploadToken, fileName, filePath, putExtra, function(respErr,respBody, respInfo) {
            if(respErr){
                reject(respErr);
            }else{
                resolve(fileName); 
            }
        });
    });
}

module.exports = {saveFile}