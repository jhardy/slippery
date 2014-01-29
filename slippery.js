(function($) {


    var slippery = 'slippery',
        defaults = {
            speed: 1200,
            delay: 6000,
            autoInit: true,
            cycle: true,
            initDelay: 1200,
            startAt: 0,
            container: "ul",
            item: "li",
            pagination: true,
            paginationParent: null,
            navArrows: false,
            arrowClass: 'slippery-arrow',
            nextArrowClass: 'slippery-next-arrow',
            prevArrowClass: 'slippery-prev-arrow',
            activeClass:"active",
            styleClass: false,
            transition: 'slideIn',
            infinite: false,
            transitionSpeed: 1200,
            calculateHeight: false,
            after: false,
            before: false
    };


    function Slippery(el, options) {

        var _ = this
        _.el = $(el);

        _.options = $.extend({}, defaults, options);

        _.items = _.el.find(_.options.item);

        if(_.items.length > 1) {
            _.init();
        }
    }

    Slippery.prototype.init = function() {
        var _ = this;

        if (_.options.pagination) {
            _.paginationHolder = _.options.paginationParent ? $(_.options.paginationParent) : _.el;
            _.createPagination();
        }

        if (_.options.navArrows) _.createNavArrows();

        _.itemCount = _.items.length;
        _.active = _.options.startAt;
        _.current = _.options.startAt;

        if(_.options.calculateHeight) _.calculateHeight();


        if(_.options.transition === "slideIn") _.slideSetup();
        if(_.options.transition === "slider") _.sliderSetup();

        $(this.items[_.active]).show();
        _.handleActiveClass($(this.items[_.active]));

        if(_.options.autoInit) {
            setTimeout(function() {
                _.start()
            }, _.options.initDelay);
        }
    }

    Slippery.prototype.createNavArrows = function() {
        var _ = this;

        var prevArrow = $('<div>', {'class': _.options.arrowClass + ' ' + _.options.prevArrowClass, 'data-direction' : '-1'});
        var nextArrow = $('<div>', {'class': _.options.arrowClass + ' ' + _.options.nextArrowClass, 'data-direction' : '1'});

        _.el.append(prevArrow, nextArrow);
        _.direction = null;

        $('.' + _.options.arrowClass).click(function(event) {
            //

             _.direction = $(this).data('direction');
            var nextSlide = _.active +  _.direction;


            if (nextSlide < 0) {
                nextSlide = _.itemCount - 1;
            } else if  (nextSlide > _.itemCount - 1) {
                nextSlide = 0;
            }

            _.current = _.active;
            _.stop();
            _.goTo(nextSlide, function() {
                _.start();
            });
        });
    }

    Slippery.prototype.createPagination = function() {
        var _ = this;
        var html = $("<ol>", {"class" : "pagination-list"});

        $.each(_.items, function(index) {
                var dot = $("<li>", {"class": "pagination-marker"})
                    .attr('data-slide-position', index);

                if(index === 0) {
                    dot.addClass(_.options.activeClass);
                }

                html.append(dot);
            });

        _.paginationHolder.append(html);
        _.paginationMarkers = _.el.find($(".pagination-list li"));

        _.el.find('.pagination-marker').click(function() {
             _.stop();

            _.current = _.active;
            var clickedIndex = $(this).index()

            if(clickedIndex !== _.active) {
                _.goTo(clickedIndex, function() {
                    if(_.options.cycle) {
                        _.start();
                    }
                });
            }
        });

        _.handleActiveClass($(this.paginationMarkers[_.active]), false);

    }

    Slippery.prototype.goTo = function(index, callback) {


        var _ = this

        _.before(_.options.before);

        if(index > _.items.length - 1)  {
                index = 0;
        }

        _.handleActiveClass($(_.items[index]));
        _.handleActiveClass($(_.paginationMarkers[index]), false);

        _.transition(_.options.transition, $(_.items[index]), $(_.items[_.current]), index);
        _.active  = index;
        _.current = index;

        if (callback && typeof(callback) === "function") {
            callback();
        }

        _.after(_.options.after);
    }


    Slippery.prototype.start = function() {

        var _ = this;
        _.timer = setInterval(function() {
            _.goTo(_.active + 1);
        }, _.options.delay);
    }

    Slippery.prototype.stop = function() {
        this.timer = clearInterval(this.timer);
        return this;
    }

    Slippery.prototype.handleActiveClass = function(el, styleClass) {
         el.addClass(this.options.activeClass).siblings().removeClass(this.options.activeClass);
         if (styleClass && this.options.styleClass) el.addClass(this.options.styleClass);
    }

    Slippery.prototype.transition = function(type, el1, el2, index) {
        var _ = this;

        switch(type) {
            case 'fade':
                el1.fadeIn(_.options.transitionSpeed);
                el2.fadeOut(_.options.transitionSpeed);
                return
            case 'slide':
                el1.animate({'left': 0}, _.options.transitionSpeed, function() {
                   el2.css({'left': _.contentWidth});
                });
                return
            case 'slider':
                if(_.options.infinite) {

                    //next slide
                    var leftVal = parseInt(_.container.css('left'), 10) - (_.itemWidth * _.direction);
                    if(_.direction === 1) {
                         _.container.animate({'left': leftVal}, _.options.transitionSpeed, function() {
                                _.container.find(_.options.item + ":last").after(_.container.find(_.options.item + ":first"));
                                _.container.css('left', _.itemWidth * (-1));

                         });
                    // prev slide
                    } else if (_.direction === -1) {
                        _.container.animate({'left': leftVal}, _.options.transitionSpeed, function() {
                            _.container.find(_.options.item + ":first").before(_.container.find(_.options.item + ":last"));
                            _.container.css('left', _.itemWidth * (-1));
                            _.direction = 1;
                        });
                    }

                } else {

                    _.container.animate({'left': -(_.itemWidth * index)}, _.options.transitionSpeed);
                }

                return
        }
    }

    Slippery.prototype.calculateHeight = function() {
        var biggestHeight = 0;

        this.items.each(function() {
            if ($(this).height() > biggestHeight ) {
                biggestHeight = $(this).height();
            }
        });

        this.el.height(biggestHeight);
    }

    Slippery.prototype.before = function(before) {
         if (before && typeof(before) === "function") {
            before();
        }
    }

    Slippery.prototype.after = function(after) {
         if (after && typeof(after) === "function") {
            after();
        }
    }

    Slippery.prototype.slideSetup = function() {
        var _ = this;
        var max = Math.max.apply( null, _.items.map(function(){return $(this).outerHeight();}).get() );

        _.contentWidth = _.el.outerWidth();
        _.el.css({'position': 'relative', 'overflow': 'hidden', 'height': (max + 50) });
        _.items.css({'position': 'absolute', 'left': _.contentWidth});

        $(_.items[_.options.startAt]).css('left', 0);

    }

    Slippery.prototype.sliderSetup = function() {

        var _ = this;
        _.container = $(_.options.container);
        _.itemWidth = $(_.items[0]).outerWidth(true);
        var widthCalc =   _.itemWidth * _.items.length;
        _.container.css('width', widthCalc);

        if(_.options.infinite) {
            _.direction = 1;
            _.items.first().before(_.items.last());
            _.container.css('left', -_.itemWidth);
        }

    }

    $.fn[slippery] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + slippery)) {
                $.data(this, 'plugin_' + slippery,
                new Slippery( this, options ));
            }
        });
    }



})(jQuery);