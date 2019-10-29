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
        let list = await this.model('demo_magnet').order('createTime desc').limit(0,100).select();
        this.assign({
            q : false,
            showList : list,
            site : this.config('site')
        })
        return this.display('magnet/index');
    }



    async searchAction(){
        var name = this.query('name') || '';
        name = name.trim();
        if(name.length ==0 ){
            let list = await this.model('demo_magnet').order('createTime desc').limit(0,100).select();
            this.assign({q : false,list : [],showList : list,site : this.config('site')});
            return this.display('magnet/index');
        }else{
            let list = await this.model('demo_magnet').where({name : ['like','%'+name+'%']}).order('createTime desc').select();
            this.assign({
                q : true,
                list : list,
                search : name,
                site : this.config('site')
            })
            return this.display('magnet/index');
        };  
    }

    async detailAction(){
        let id = this.query('id');
        if(id){
            let obj = await this.model('demo_magnet').where({infohash:id}).find();
            if(think.isEmpty(obj)){
                this.assign({success : false,site : this.config('site')})
                this.display('magnet/detail');
            }else{
                console.log(obj.json);
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