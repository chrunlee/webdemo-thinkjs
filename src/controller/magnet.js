const Base = require('./base.js');

function format(  size, pointLength, units ){
    var unit;
    units = units || [ 'B', 'KB', 'M', 'G', 'TB' ];

    while ( (unit = units.shift()) && size > 1024 ) {
        size = size / 1024;
    }
    return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) + unit;
}

module.exports = class extends Base {
    async indexAction() {
        let list = await this.cache('demo_magnet_first',()=>{
            return this.model('demo_magnet').order('createTime desc').limit(0,100).select();
        });
        this.assign({
            q : false,
            showList : list,
            site : this.config('site')
        })
        return this.display('magnet/index');
    }



    async searchAction(){
        var name = this.query('name') || '';
        var page = this.query('page') || '1';
        var rows = 20;
        var type = this.query('type') || '1';//0 上一页，1 下一页
        name = name.trim();
        try{
            if(name.length ==0 ){
                let list = await this.cache('demo_magnet_first',()=>{
                    return this.model('demo_magnet').order('createTime desc').limit(0,100).select();
                });
                this.assign({q : false,list : [],showList : list,site : this.config('site')});
                return this.display('magnet/index');
            }else{
                var curPage = 1;
                try{
                    curPage = parseInt(page,10);
                    curPage = Math.max(1,curPage);
                }catch(er){
                    curPage = 1;
                }
                let start = (curPage-1)*20;
                let list = await this.cache('demo_magnet_search_'+name+'_'+start,()=>{
                    return this.model('demo_magnet').field('id,name,filesize,fileaddress,fileport,magnet,infohash,createTime,hots').where({name : ['like','%'+name+'%']}).limit(start,20).order('hots desc,createTime desc').select();
                })
                let total = await this.cache('demo_magnet_search_count_'+name,()=>{
                    return this.model('demo_magnet').field('id').where({name : ['like','%'+name+'%']}).count();
                });
                this.assign({
                    total : total,
                    curr : curPage,
                    page : curPage,
                    q : true,
                    list : list,
                    search : name,
                    site : this.config('site')
                })
                return this.display('magnet/index');
            };  
        }catch(er){
            console.log(er);
            return this.redirect('/magnet/index');
        }
    }

    async detailAction(){
        let id = this.query('id');
        if(id){
            let obj = await this.cache('demo_magnet_'+id,()=>{return this.model('demo_magnet').where({infohash:id}).find();});
            if(think.isEmpty(obj)){
                this.assign({success : false,site : this.config('site')})
                this.display('magnet/detail');
            }else{
                var json = JSON.parse(obj.json);
                json.size = format(json.size);
                json.files.forEach(item=>{
                    item.size = format(item.size);
                });
                this.assign(json);
                this.assign('site',this.config('site'))
                return this.display('magnet/detail');
            }
        }else{
            this.assign('site',this.config('site'))
            return this.redirect('/magnet/index');
        }
    }
}