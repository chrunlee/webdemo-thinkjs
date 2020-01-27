const Base = require('./wx');

const path = require('path');

module.exports = class extends Base {


    async indexAction(){
        let data = await this.model('demo_feiyan').order('fetchtime desc').limit(0,1).find();
        this.assign('data',data);
        return this.display("wechat/feiyan/index")
    }
    
}
