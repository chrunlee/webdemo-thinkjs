const Base = require('./base.js');
let mailer = require('../util/mailer');
let ding = require('../util/ding');
let moment = require('moment');
const crypto = require('crypto');

//进行脚本调用处理
async function createDatXulie(think,email){
    //create
    let repeatflag = true;
    let currentcode = '';
    while(repeatflag){

        let time = (+new Date())+'';
        let timestr = crypto.createHash('md5').update(time).digest('hex');
        let code = timestr.substr(timestr.length-10);
        //判断是否重复
        let codedata = think.model('user_code').where({type : 'dat2m',code : code}).find();
        if(codedata == null || !codedata.code){
            await think.model('user_code').add({
                code : code,
                type : 'dat2m',
                enable : 1,
                userid : email
            });
            currentcode = code;
            repeatflag = false;
        }
    }
    return currentcode;
}

module.exports = class extends Base {
    async indexAction() {
        think.logger.info(JSON.stringify(this.post()));
        let data = this.post();
        if (!data.money || null == data.money || undefined == data.money || data.money == 'null') {
            return this.json({ success: false, msg: '无效金额' });
        }
        let dingding = new ding(this.config('site').dingding.value)
        //根据deviceid 来进行校验设备
        let deviceList = await this.model('order_device').select();
        let currentId = data.deviceid;
        let hasCheck = false;
        deviceList.forEach(item => {
            if (item.deviceid == currentId) {
                hasCheck = true;
            }
        })
        if (hasCheck) { //进行相关订单操作
            let insertData = {
                fromtype: data.type,
                orderno: data.orderno || '',
                orderprice: data.money || '',
                ordertime: data.time || '',
                orderuser: data.user || '',
                orderstatus: 1,
                sendstatus: 0,
                title: data.title || '',
                deviceid: data.deviceid || '',
                content: data.content || ''
            }
            let insertId = await this.model('order_list').add(insertData);
            //根据价格查找当前时间5分钟以内的该价格的订单
            let startTime = moment().subtract(300,'seconds').format('YYYY-MM-DD HH:mm:ss');
            let undoList = await this.model('order_user').where({status : '0',starttime : ['>',startTime],price : data.money}).select();
            // let undoList = await this.model().query('select * from order_user where UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(starttime) < 360 and price="'+data.money+'" and status="0"');
            if (undoList == null || undoList.length == 0) {
                //说明有人付款，但是未查到是谁付款。这里请给我个钉钉
                await dingding('','商品售卖:有人付款，但是未查询到订单来源。(' + data.content + ')');
            } else {
                //找到订单人
                let order = undoList[0];
                //获得邮箱地址，发送内容
                let email = order.email,
                    goodId = order.goodid;
                //更新状态
                await this.model('order_user').where({id : order.id}).update({status : '1'});
                //获得商品的发送内容
                let goodItem = await this.model('order_goods').where({id : goodId}).find();
                if (think.isEmpty(goodItem)) {
                    //商品不存在，请ding我
                    await dingding.sendText('','商品售卖:商品不存在，请检查.(' + goodId + ')')
                } else {
                    let sendContent = goodItem.content;
                    //处理发送内容
                    let model = this;
                    if(goodItem.shellscript){
                        let rststr = await eval(goodItem.shellscript);
                        sendContent = sendContent.replace('SHELLSCRIPT',rststr);
                    }
                    let goodName = goodItem.name;
                    let sucnum = goodItem.sucnum || 0;
                    //发送邮件
                    await mailer.sendOrderEmail(this.config('site').email.value,this.config('site').emailpwd.value,email, goodName, sendContent);
                    //更新订单状态和数量
                    await this.model('order_list').where({id : insertId}).update({sendstatus : '1'});
                    await this.model('order_goods').where({id : goodId}).increment('sucnum',1);
                    //顶我
                    await dingding.sendText('','商品售卖:交易成功。(' + data.content + ')')
                }
            }
            return this.json({ success: true, msg: '接受成功' });
        } else {
            //当前数据无效
            return this.json({ success: false, msg: '无效数据' });
        }
    }
};