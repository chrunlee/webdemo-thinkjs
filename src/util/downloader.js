//下载图片
let axios = require('axios');
let fs = require('fs');

module.exports.downloadPicture = function downloadPicture (href,picpath){
    return new Promise((resolve,reject)=>{
        axios.get(href,{
            responseType : 'stream'
        })
        .then(rs=>{
            const ws = fs.createWriteStream(picpath);
            ws.on('close',()=>{
                resolve();
            });
            ws.on('error',(err)=>{
                reject(err);
            })
            rs.data.pipe(ws);
        })
        .catch(err=>{
            reject(err);
        })
    });
}