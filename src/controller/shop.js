const Base = require('./base.js');
let qr_image = require('qr-image');
let marked = require('marked');
let ding = require('../util/ding');
let UA = require('../util/UA');
let path = require('path');
let fs = require('fs');
let wsf = require('../util/wsf');
let moment = require('moment');
//markdown 解析器
var renderer = new marked.Renderer();
//重写解析规则
renderer.link = function(href, title, text) {
    return '<a href="' + href + '" title="' + text + '" target="_blank">' + text + '</a>';
}
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false, //消毒：意思是将html转义成&xxx等。
    silent: true,
    smartLists: true,
    smartypants: false

});
/***
 * 小店展示。
 **/
module.exports = class extends Base {

    async __before(){
        let flag = await super.__before();
        if(flag == false){
            return false;
        }
        let id = await this.session('id');
        if(!id){
            let sid = think.uuid('v4');
            await this.session('id',sid);
        }
    }
    //首页
    async indexAction() {
        let sess = await this.session();
        let list = await this.model('order_goods').where({ status: '0' }).order('updatetime desc').select();
        this.assign({ rows: list, site: this.config('site'), links: this.config('links') })
        return this.display('shop/index');
    }

    //详情页面
    async detailAction() {
        let id = this.query('id');
        if (id) {
            let good = await this.model('order_goods').where({ id: id }).find();
            if (think.isEmpty(good)) {
                return this.redirect('/shop.html');
            }
            let dealSes = await this.session('deal');
            good.html = marked(good.description, { renderer: renderer });
            let ua = UA(this.header('user-agent'));
            this.assign({ item: good, site: this.config('site'), ismobile: ua.os == 'android' || ua.os == 'ios' ? true : false ,email : (dealSes||{}).email||''});
            return this.display('shop/detail');
        } else {
            this.redirect('/shop.html');
        }
    }

    //关注度
    async careAction() {
        let id = this.post('id');
        if (id) {
            await this.model('order_goods').where({ id: id }).increment('viewnum', 1);
            return this.json({ success: true })
        }
        return this.json({ success: false });
    }

    //更新email
    async emailAction() {
        let email = this.post('email');
        let type = this.post('type');
        let dealSession = await this.session('deal');
        if (think.isEmpty(dealSession)) {
            dealSession = {};
        }
        if (email) {
            dealSession.email = email;
        }
        if (type) {
            dealSession.type = type; //支付方式。
        }
        await this.session('deal', dealSession);
        this.json({ success: true, msg: 'success' });
    }

    //进入交易区
    async dealAction() {
        try {
            let goodId = this.query('id');
            if (!goodId) {
                return this.redirect('/shop.html');
            }
            let goodItem = await this.model('order_goods').where({id : goodId}).find();
            if (think.isEmpty(goodItem)) {
                return this.redirect('/shop.html');
            }
            let price = parseFloat(goodItem.price, 10);
            //如果当前session中没有email,则重新调回详情页面
            let dealSession = await this.session('deal');
            if (!dealSession || !dealSession.email) {
                return this.redirect('/shop/detail/' + goodId + '.html');
            }
            //根据sessionId 与 时间，配对当前唯一ID
            let sessionId = await this.session('id');
            let datestr = ((+new Date()) + '').substr(0, 6);
            let uniqueId = sessionId + '_' + datestr;
            //检查当前数据库中是否存在待支付的订单
            let dealPrice = price;
            let dingding = new ding(this.config('site').dingding.value);
            await dingding.sendText('','商品售卖:客户进入交易区[' + goodItem.name + ']，请保持打开支付助手并打开微信支付宝消息提醒推送消息！！！');
            //待支付，且时间不超过5分钟的。
            let momentStartTime = moment().subtract(300,'seconds').format('YYYY-MM-DD HH:mm:ss');
            let list = await this.model('order_user').where({status : '0',starttime : ['>',momentStartTime],sid : uniqueId,goodid : goodId}).select();
            let dealId = null;
            let longtime = null;
            if (null == list || list.length == 0) {
                //当前不存在，则插入
                //1.0 获得当前可用的价格
                let countTimes = 1,
                    hasCheck = false;
                let finalPrice = price;
                while (!hasCheck && countTimes < 6) {
                    let tempPrice = price - (0.01 * countTimes);
                    let checkPrice = parseFloat(tempPrice.toFixed(2));
                    //检查
                    let tempStartTime = moment().subtract(240,'seconds').format('YYYY-MM-DD HH:mm:ss');
                    //并且时间是最近5分钟
                    let timestra = moment().subtract(240,'seconds').format('YYYY-MM-DD HH:mm:ss');
                    let existsList = await this.model('order_user').where({status : '0',price : checkPrice,starttime : ['>',timestra]}).select();
                    if (null == existsList || existsList.length == 0) {
                        //不存在，可以插入
                        hasCheck = true;
                        finalPrice = checkPrice;
                    } else {
                        countTimes++;
                    }
                }
                if (!hasCheck) {
                    return this.body = '<script>alert("当前商品交易比较火爆，请稍后几分钟进行尝试")</script>';
                }
                //根据价格生成支付宝的二维码，检查有没有该二维码，没有则生成。
                let starttime = new Date();
                longtime = starttime.getTime() + '';
                let timestr = moment(starttime).format('YYYY-MM-DD HH:mm:ss');
                let insertData = { goodid: goodId, email: dealSession.email, price: finalPrice, status: '0', sid: uniqueId, starttime: timestr, startlong: longtime };
                dealId = await this.model('order_user').add(insertData);                
                dealPrice = finalPrice;
            } else {
                let orderObj = list[0];
                dealPrice = orderObj.price;
                dealId = orderObj.id;
                longtime = orderObj.startlong;
            }
            let ua = UA(this.header('user-agent'));
            this.assign({
                site: this.config('site'),
                item: goodItem,
                ismobile: ua.os == 'android' || ua.os == 'ios' ? true : false,
                data: {
                    type: dealSession.type,
                    email: dealSession.email,
                    starttime: longtime,
                    goodId: goodId,
                    dealId: dealId,
                    dealPrice: dealPrice
                }
            });
            return this.display('shop/deal');
        } catch (e) {
            think.logger.error(e);
            //有出错，直接返回列表页面并进行提示。
            return this.redirect('/shop.html');
        }
    }
    //二维码生成
    async qrAction(){
        let dealPrice = this.query('dealPrice');
        let dealId = this.query('dealId');
        let type = this.query('type') || 'weixin';
        let obj = await this.model('order_qr').where({price : dealPrice}).find();
        if(think.isEmpty(obj)){
            return this.body = '二维码获取失败';//直接替换一个base二维码，固定的。
        }else{
            //判断当前是否是移动端
            let ua = UA(this.header('user-agent'));
            this.header('Content-type', 'image/png');
            let baseUrl = '';
            let name = type == 'weixin' ? obj.weixin : obj.result;
            name = name.replace(/[\/\\:\.]/g,'');
            let filePath = '/static/upload/qr/'+name+'.png';
            let absPath = path.join(think.ROOT_PATH,'www',filePath);
            if(fs.existsSync(absPath)){
                this.download(absPath);
            }else{
                let imageObj = qr_image.image(baseUrl+(type == 'weixin' ? obj.weixin : obj.result),{ type: 'png' });
                think.mkdir(path.dirname(absPath));
                let ws = fs.createWriteStream(absPath);
                await wsf(ws,imageObj);
                this.download(absPath);
            }
            // return false;
        }
    }
};