//操蛋的文件流
module.exports = function(ws,rs){
    return new Promise((resolve,reject)=>{
        ws.on('close',()=>{
            resolve();
        });
        rs.pipe(ws);
    });
    
}