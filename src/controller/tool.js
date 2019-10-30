//工具类相关的页面处理
const Base = require('./base.js');

module.exports = class extends Base {
    //微信dat转码页面
    async wechatdatAction() {
        this.assign({
            site : this.config('site')
        })
        return this.display('tool/wechatdat');
    }


}