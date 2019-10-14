//提供一些自己常用的工具类API 

const Base = require('./base.js');
let getProxyIp = require('../util/getProxyIp');
let ipDateMap = {};
let moment = require('moment');
module.exports = class extends Base {
    
    /***
     * 每次获取一个IP，不论是否可用，IP是从齐云代理获取的免费IP
     * 用于浏览器插件使用-IP可用率不高
     * 每天都从第一页开始抓取，然后返回。
     ***/
    async getIpAction(){
        let code = this.post('code') || this.query('code');
        if(code != this.config('site').apicode.value){
            return this.fail(10086,'sorry, wrong code!');
        }
        let startDate = moment().format('YYYY-MM-DD');
        let obj = ipDateMap[startDate] || {
            arr : [],
            page : 0
        };
        if(obj.arr.length == 0){
            //page++
            obj.page++;
            obj.arr = await getProxyIp(obj.page);
        }
        //返回一个数据对象
        let backData = obj.arr.splice(0,1)[0];
        ipDateMap[startDate] = obj;
        return this.json(backData);
    }
}