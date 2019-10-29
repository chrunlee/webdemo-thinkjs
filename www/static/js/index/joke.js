byy.require(['jquery','win'],function(){

    var main = {

        events : {
            next : function(){
                main.next();
            },
            like : function(){
                main.like();
            }
        },
        like : function(){
            var id = $('#id').val();
            if($('.a').hasClass('like')){
                return;
            }
            $.ajax({
                url : '/joke/like',
                type : 'post',
                data : {id : id},
                success : function(rs){
                    $('.a').addClass('like');
                    $('.a p').html('喜欢（'+rs+'）');
                }
            });
        },
        //下一个
        next : function(){
            location.href = '/joke/index';
        },
        start : function(){
            byy.bindEvents(main.events);
        }

    };
    main.start();
    //1.绑定快捷键
    $('body').on('keyup',function(ev){
        var code = ev.keyCode ;
        if(code === 39){
            //下一个
            main.next();
        }else if(code === 32){
            //喜欢
            main.like();
        }
    })


})