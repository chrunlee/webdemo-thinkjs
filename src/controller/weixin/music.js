const Base = require('./wx');
const https = require('https');
const path = require('path');

const axios = require('axios');

module.exports = class extends Base {


    constructor(ctx) {
        super(ctx);
        this.assign('site', this.config('site'));
    }
    async getPicBase(pic){        
        return new Promise((resolve,reject)=>{
            https.get(pic, function(res2) {
                var chunks = []; //用于保存网络请求不断加载传输的缓冲数据
                var size = 0; //保存缓冲数据的总长度

                res2.on('data', function(chunk) {
                    chunks.push(chunk);
                    size += chunk.length; //累加缓冲数据的长度
                });

                res2.on('end', function(err) {
                    var data = Buffer.concat(chunks, size); //Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
                    var base64Img = data.toString('base64'); //将Buffer对象转换为字符串并以base64编码格式显示
                    resolve(base64Img);
                });
            });
        });
    }
    async detailAction() {
        let id = this.query('id');
        let app = this;
        id = id.trim();
        let data = await this.model('music_music').where({ sid: id }).find();
        if (think.isEmpty(data)) {
            this.assign({ title: '查询失败', msg: '音乐地址输入错误，没有该音乐哦!<br /><a href="/weixin/story/index">回到首页</a>' })
            return this.display('wechat/tip');
        }
        //picture 转 base64
        this.assign("data", data);
        // let st = await axios.get(data.picture,{responseType : 'stream'}).then(rs=>rs.data);
        let baseimg = await this.getPicBase(data.picture);
        this.assign('picture',baseimg);
        return this.display('wechat/music/detail')
    }

}