module.exports = class extends think.Controller {
  __before() {

  }

  __call (){
    this.assign('site',this.config('site'));
    return this.display('error/404');
  }
};
