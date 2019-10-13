let fs = require('fs');
//dat 转码获得base64
let base = 0xFF;
let jn = 0xD8;
let gifA = 0x47;
let gifB = 0x49;
let pngA = 0x89;
let pngB = 0x50;
module.exports = function(filePath){
    return new Promise((resolve,reject)=>{
        fs.readFile(filePath,(err,content)=>{
            if(err){
                reject(err);
            }else{
                let firstV = content[0],
                    nextV = content[1],
                    jT = firstV ^ base,
                    jB = nextV ^ jn,
                    gT = firstV ^ gifA,
                    gB = nextV ^ gifB,
                    pT = firstV ^ pngA,
                    pB = nextV ^ pngB;
                var coder = firstV ^ base;
                if(jT == jB){
                    coder = jT;
                }else if(gT == gB){
                    coder = gT;
                }else if(pT == pB){
                    coder = pT;
                }
                let bb = content.map(br=>{
                    return br ^ coder
                })
                let b64 = bb.toString('base64');
                resolve(b64);
            }
        })
    });
}