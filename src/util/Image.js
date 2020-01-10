/***
 * 对图片进行处理，包括：压缩、旋转、裁切、模糊等等
 ***/

var Jimp = require('jimp');
const webp = require('webp-converter');
const fs = require('fs');


//对图片进行质量压缩
module.exports.compress = function( filePath,compressVal ){
    return new Promise(function(resolve,reject){
        Jimp.read(filePath).then(function(image){
            image.quality(compressVal).write(filePath);
            resolve();
        }).catch(function(err){
            reject(err);//
        });
    });
}
//转webp 为jpg格式
module.exports.convertWebpJpg = function(filepath,targetpath){
    return new Promise(function(resolve,reject){
        webp.dwebp(filepath, targetpath, ' -o ', function(status, err) {
            if(status == '100'){
                resolve();
            }else{
                reject();
            }
        });
    });
}
//获得图片文件的base64编码
module.exports.getBaseStr = function(filepath){
    return new Promise(function(resolve,reject){
        fs.readFile(filepath,function(err,content){
            if(err){
                reject(err);
            }else{
                let str = content.toString('base64');
                resolve(str)
            }
        })
    });
}