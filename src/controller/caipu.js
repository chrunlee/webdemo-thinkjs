const Base = require('./base.js');

module.exports = class extends Base {
    indexAction() {
        return this.display();
    }

    async categoryAction() {
        //返回所有的菜谱分类并归纳
        let rst = await this.model('caipu_fenlei').select();
        var map = {};
        rst.forEach(function(item) {
            var category = item.category;
            var data = map[category] || [];
            data.push(item);
            map[category] = data;
        });
        var list = [];
        for (var c in map) {
            list.push({
                name: c,
                data: map[c]
            });
        }
        return this.body = JSON.stringify({
            success: true,
            msg: '请求成功',
            result: list
        })
    }

    async itemAction() {
        let cid = this.post('cid') || this.query('cid');
        let start = this.post('start') || this.query('start') || 0;
        let pagesize = this.post('pagesize') || this.query('pagesize') || 10;

        try {
            start = parseInt(start, 10)
        } catch (e) { start = 0; }
        try {
            pagesize = parseInt(pagesize, 10);
        } catch (e) { pagesize = 10; }
        if (cid) {
            let list = await this.model('caipu_item').where({ cid: cid }).limit(start, pagesize).select();
            return this.body = JSON.stringify({
                success: true,
                msg: '请求成功',
                result: list
            });
        } else {
            return this.body = JSON.stringify({
                success: false,
                msg: '未传递类目参数'
            });
        }
    }

    async listAction() {
        let cid = this.post('cid') || this.query('cid');
        if (cid) {
            let itemList = await this.model('caipu_item').where({ cid: cid }).select();
            let stepList = await this.model().query('select * from caipu_step where itemid in (select id from caipu_item where cid="' + cid + '")');
            var map = {};
            stepList.forEach(function(item) {
                var itemId = item.itemid;
                var arr = map[itemId] || [];
                arr.push(item);
                map[itemId] = arr;
            });
            itemList.forEach(function(item) {
                var itemId = item.id;
                var arr = map[itemId] || [];
                arr.sort(function(a, b) {
                    return a.step - b.step;
                })
                item.steps = arr;
            });
            return this.body = JSON.stringify({
                success: true,
                msg: '请求成功',
                result: itemList
            });
        } else {
            return this.body = JSON.stringify({
                success: false,
                msg: '未传递类目参数'
            });
        }
    }


    async findAction() {
        let name = this.post('name') || this.query('name');
        let start = this.post('start') || this.query('start') || 0;
        let pagesize = this.post('pagesize') || this.query('pagesize') || 10;
        try {
            start = parseInt(start, 10)
        } catch (e) { start = 0; }
        try {
            pagesize = parseInt(pagesize, 10);
        } catch (e) { pagesize = 10; }
        if (name) {
            let rst = await this.model().query('select * from caipu_item where title like "%' + name + '%" or ingredients like "%' + name + '%" limit ' + start + ',' + pagesize + '');
            return this.body = JSON.stringify({
                success: true,
                msg: '请求成功',
                result: rst
            });
        } else {
            return this.body = JSON.stringify({
                success: false,
                msg: '未传递关键词参数'
            });
        }
    }

    async getAction() {
        let id = this.post('id') || this.query('id');
        if (id) {
            let itemList = await this.model('caipu_item').where({ id: id }).select();
            let stepList = await this.model('caipu_step').where({ itemid: id }).select();
            //整合数据
            var map = {};
            stepList.forEach(function(item) {
                var itemId = item.itemid;
                var arr = map[itemId] || [];
                arr.push(item);
                map[itemId] = arr;
            });
            itemList.forEach(function(item) {
                var itemId = item.id;
                var arr = map[itemId] || [];
                arr.sort(function(a, b) {
                    return parseInt((a.step || 0), 10) - parseInt((b.step || 0), 10);
                })
                item.steps = arr;
            });
            return this.body = JSON.stringify({
                success: true,
                msg: '请求成功',
                result: itemList
            })
        } else {
            return this.body = JSON.stringify({
                success: false,
                msg: '未传递类目参数'
            });
        }
    }
};