/*
	@company 博育云
	@site : www.boyuyun.cn
	@author boyuyun
*/

byy.define("jquery",function(a){"use strict";var b=window.jQuery||byy.jquery,c=(byy.device(),{config:{},set:function(a){var c=this;return c.config=b.extend({},c.config,a),c}}),d="byy-this",e="byy-carousel-arrow",f="byy-carousel-ind",g=function(a){var d=this;d.config=b.extend({},d.config,c.config,a),d.render()};g.prototype.config={width:"600px",height:"280px",full:!1,arrow:"hover",indicator:"inside",autoplay:!0,interval:3e3,anim:"",trigger:"click",index:0},g.prototype.render=function(){var a=this,c=a.config;c.elem=b(c.elem),c.elem[0]&&(a.elemItem=c.elem.find(">*[carousel-item]>*"),c.index<0&&(c.index=0),c.index>=a.elemItem.length&&(c.index=a.elemItem.length-1),c.interval<800&&(c.interval=800),c.full?c.elem.css({position:"fixed",width:"100%",height:"100%",zIndex:9999}):c.elem.css({width:c.width,height:c.height}),c.elem.attr("byy-anim",c.anim),a.elemItem.eq(c.index).addClass(d),a.elemItem.length<=1||(a.indicator(),a.arrow(),a.autoplay(),a.events()))},g.prototype.reload=function(a){var c=this;clearInterval(c.timer),c.config=b.extend({},c.config,a),c.render()},g.prototype.prevIndex=function(){var a=this,b=a.config,c=b.index-1;return c<0&&(c=a.elemItem.length-1),c},g.prototype.nextIndex=function(){var a=this,b=a.config,c=b.index+1;return c>=a.elemItem.length&&(c=0),c},g.prototype.addIndex=function(a){var b=this,c=b.config;a=a||1,c.index=c.index+a,c.index>=b.elemItem.length&&(c.index=0)},g.prototype.subIndex=function(a){var b=this,c=b.config;a=a||1,c.index=c.index-a,c.index<0&&(c.index=b.elemItem.length-1)},g.prototype.autoplay=function(){var a=this,b=a.config;b.autoplay&&(a.timer=setInterval(function(){a.slide()},b.interval))},g.prototype.arrow=function(){var a=this,c=a.config,d=b(['<button class="'+e+'" byy-type="sub">'+("updown"===c.anim?'<i class="byyicon icon-arrow-up"></i>':'<i class="byyicon icon-arrow-left"></i>')+"</button>",'<button class="'+e+'" byy-type="add">'+("updown"===c.anim?'<i class="byyicon icon-arrow-down"></i>':'<i class="byyicon icon-arrow-right"></i>')+"</button>"].join(""));c.elem.attr("byy-arrow",c.arrow),c.elem.find("."+e)[0]&&c.elem.find("."+e).remove(),c.elem.append(d),d.on("click",function(){var c=b(this),d=c.attr("byy-type");a.slide(d)})},g.prototype.indicator=function(){var a=this,c=a.config,d=a.elemInd=b(['<div class="'+f+'"><ul>',function(){var b=[];return byy.each(a.elemItem,function(a){b.push("<li"+(c.index===a?' class="byy-this"':"")+"></li>")}),b.join("")}(),"</ul></div>"].join(""));c.elem.attr("byy-indicator",c.indicator),c.elem.find("."+f)[0]&&c.elem.find("."+f).remove(),c.elem.append(d),"updown"===c.anim&&d.css("margin-top",-d.height()/2),d.find("li").on("hover"===c.trigger?"mouseover":c.trigger,function(){var d=b(this),e=d.index();e>c.index?a.slide("add",e-c.index):e<c.index&&a.slide("sub",c.index-e)})},g.prototype.slide=function(a,b){var c=this,e=c.elemItem,f=c.config,g=f.index;f.elem.attr("byy-filter");c.haveSlide||("sub"===a?(c.subIndex(b),e.eq(f.index).addClass("byy-carousel-prev"),setTimeout(function(){e.eq(g).addClass("byy-carousel-right"),e.eq(f.index).addClass("byy-carousel-right")},50)):(c.addIndex(b),e.eq(f.index).addClass("byy-carousel-next"),setTimeout(function(){e.eq(g).addClass("byy-carousel-left"),e.eq(f.index).addClass("byy-carousel-left")},50)),setTimeout(function(){e.removeClass(d+" byy-carousel-prev byy-carousel-next byy-carousel-left byy-carousel-right"),e.eq(f.index).addClass(d),c.haveSlide=!1},300),c.elemInd.find("li").eq(f.index).addClass(d).siblings().removeClass(d),c.haveSlide=!0)},g.prototype.stop=function(){var a=this;a.config;clearInterval(a.timer)},g.prototype.play=function(){var a=this;a.config;a.autoplay()},g.prototype.events=function(){var a=this,b=a.config;b.elem.data("haveEvents")||(b.elem.on("mouseenter",function(){clearInterval(a.timer)}).on("mouseleave",function(){a.autoplay()}),b.elem.data("haveEvents",!0))},c.render=function(a){return new g(a)},a("slider",c)});