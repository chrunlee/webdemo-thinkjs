/***
 websocket controller
 ***/
module.exports = class extends think.Controller {
    constructor(...arg) {
        super(...arg);
    }

    async openAction() {
        let id = await this.session();
        console.log(id);
        let cid = this.cookie('thinkjs');
        console.log(cid);
        this.emit('opend', 'This client opened successfully!')
        this.broadcast('joined', 'There is a new client joined successfully!')
    }

    async msgAddAction() {
        let d = this.wsData;
        let account = this.config('site').superaccount.value;
        let pwd = this.config('site').superpwd.value;
        if(d.account == account && d.password == pwd && d.msg != ''){
            think.logger.warn(`[Websocket]-[广播] : ${d.msg}`);
            this.broadcast('msged',d.msg);
        }
    }
    //统计在线人数
    async onlineAction(){
        let d = this.wsData;
        let account = this.config('site').superaccount.value;
        let pwd = this.config('site').superpwd.value;
        if(d.account == account && d.password == pwd && d.msg != ''){
            think.logger.warn(`[Websocket]-[广播] : ${d.msg}`);
            this.broadcast('online',d.msg);
        }
    }
    async closeAction(){}
}