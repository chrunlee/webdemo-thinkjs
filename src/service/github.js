let superagent = require('superagent');
module.exports = class extends think.Service {

    constructor() {
        super();
    }

    async getUser(clientId,secret,code,state) {

        let github = await superagent.post('https://github.com/login/oauth/access_token')
            .set('Accept', 'application/json')
            .send({
                "client_id": clientId,
                "client_secret": secret,
                "code": code,
                "state": state
            })
            .then(function(res2) {
                return JSON.parse(res2.text);
            })
            .then(function(obj) {
                return superagent.get('https://api.github.com/user?access_token=' + obj.access_token).set('User-Agent', 'chrunleeAutoLogin');
            })
            .then(function(res2) {
                return JSON.parse(res2.text);
            });
        return github;
    }

    getLogin (clientId,scope,state){
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`;
    }
}