/***********************************************************
  
  Description:
    Make a simple slider out of list items.
    
  Basic usage:
    
    The mininum html required is a list in a container:
    
    <div id="my-slider-id">
      <ul>
        <li> some stuff here </li>
        <li> more things there </li>
          .
          .
          .
        <li> bla bla </li>
      </ul>
    </div>
    
    This is the javascript to make the slider:
    
    var mySlider = new listSlider( $("#my-slider-id"), {} );
    mySlider.init();

  Options:
    * slide_speed [int]: speed of a slide animation in ms
    * slide_delay [int] : time between each slide in ms
    * loop [true/false] : loop back to first slide when sliding
      past last slide, or forward to last slide when sliding
      back from first slide.
    * items_per_viewport [int] : number of visible slides (li) per
      viewport
    * auto_slide [true/false] : start and loop thru slides
      automatically
    * no_css : prevent from adding the required css style inline,
        if it needs to be adjusted or in a seperated file for
        example
    * debug [true/false] : output different info, may help to
      debug

  Binding events:
    Add the element to be notified about slider event to the
    registered objects.
    
    The following events are fired:
      - 'ls-slidestart' : when the slide animation starts
      - 'ls-slideend' : when the slide animation ends
      
    Example:
      var someElement = $('#some-element');
      mySlider.register( someElement );
      someElement.bind('ls-slidestart',function(e,index){
        alert('Sliding to index ' + index);
      });

*/

var listSlider = function ( el, options ) {
  
  // default settings
  var settings = $.extend({
    slide_speed : 500,
    slide_delay : 3000,
    loop : false,
    items_per_viewport : 1,
    auto_slide : false,
    no_css : false,
    debug : false
  },options);
  
  // reference to root dom element and this slider
  var root = el;
  var ref = this;
  
  // index of current slide
  var current = 0;
  this.currentIndex = function() { return current; }
  
  // number of slides
  var items = 0;
  this.maxIndex = function () { return items-1; }
  
  // width
  var sw = 0; // slide width
  var bw = 0; // board width
  var vw = 0; // viewport width
  
  // inline styles
  var vpCss = {"position":"relative","width":"100%","height":"100%","overflow":"hidden"}
  var sbCss = {"position":"relative","margin":0,"padding":0,"font-size":0,"height":"100%"}
  var liCss = {"position":"relative","display":"inline-block","float":"left","width":"100%",
    "height":"100%","font-size":"16px","list-style-type":"none","margin":0}
  
  /*********************************************************
    Init the slider. This should be called after document
    load.
  *********************************************************/
  var initialized = false;
  this.init = function (){
    try {
      if( initialized ) { throw 'Slider already initialized' }

      // check root element
      if( !root ) { throw 'Root element is null' }
      else if ( !(root instanceof jQuery ) ) { root = $(root); }
      root.addClass("list-slider");
    
      // find <ul> tag (slider board)
      var sb = root.find("ul").addClass("slider-board");
      if(!sb.length) { throw "no <ul> tag found" }
      if( !settings.no_css ) { sb.css( sbCss ); }
   
      // wrap the slider board in a new div (viewport)
      var vp = $('<div class="viewport"></div>');
      vp.append(sb);
      if( !settings.no_css ) { vp.css( vpCss ); }
      root.append(vp);
    
      // number of items
      items = parseInt( sb.find('li').size() );
      if( !settings.no_css ) { sb.find('li').css( liCss ); }
    
      // resize the slider if window is resized
      $(window).resize(function(){ updSize(); }).resize();
        
      // start slider
      if( settings.auto_slide ) { this.start(); }
      slideToIndex(0);
      
      initialized = true;
    }
    catch (err) {
      console.error('Error in slider.init():\n' + err);
    }
  };
  
  /*********************************************************
    Update the size of the slider elements. Mainly for 
    responsive purpose, this function is bound to the 
    window resize events.
  *********************************************************/
  var updSize = function () {
    try {
      // size of the viewport
      vw = root.find('.viewport').width();
      var vh = root.find('.viewport').height();
      
      // the width of one slice
      sw = vw / settings.items_per_viewport;
      
      // the width of the board
      bw = sw * items
        
      el.find('.slider-board li').css({ "width" : sw });
      el.find('.slider-board').css({ "width": bw });
      
      // debug info
      if( settings.debug ) {
        console.log('updSize: viewport width: ' + vw
          + ' / slide width: '+sw+' / board width: '+bw)
      }
    }
    catch(err) {
      console.log('Error in listSlider.updSize\n' + err);
    }
  }

  /*********************************************************
    Slide to the slide of specified index.
  *********************************************************/
  var slideToIndex = function(index) {
    if( settings.debug ) { console.log('slideToIndex('+index+')'); }
    try {
      // stop slider
      ref.stop();
    
      // check index is valid
      if( index<0 || index>=items ){
        throw 'Invalid slide index \''+index+'\'';
      }
      // offset to slide the board to
      var left = index * sw * -1;
            
      // notify start of sliding
      notify('ls-slidestart',[index]);
      if( settings.debug ) { console.log('Slide to '+index+' start'); }
      
      // sliding animation
      root.find('.slider-board').stop().animate({
        "margin-left" : left
      },settings.slide_speed, function(){

        // notify end of sliding
        notify('ls-slideend',[index]);
        
        if( settings.debug ) { console.log('Slide to '+index+' end'); }
      });
      
      // queue next slide if on auto_slide
      if( settings.auto_slide ) {
        ref.start();
      }
    }
    catch(err) {
      console.error("Error in listSlider.slideToIndex():\n" + err);
    }
  }
    
  this.slideTo = function (index) {
    current = index;
    slideToIndex( current );
  }
  
  this.slideNext = function () {
    current++;
    // if it's the last slide
    if( current >= items || current > items - settings.items_per_viewport ) {
      // if loop = true, slide to first slide
      if( settings.loop ) {
        current = 0;
        slideToIndex(current);
      }
      // if not dont slide, current is the index of the last slide
      else { current = items - settings.items_per_viewport; }
    }
    else {
      slideToIndex( current );
    }
  }
    
  this.slidePrev = function () {
    current--;
    // if first slide
    if( current < 0 ){
      // if loop = true, slide to last slide
      if( settings.loop ) {
        current = items - settings.items_per_viewport;
        slideToIndex(current);
      }
      else { current = 0; }
    }
    else {
      slideToIndex( current );
    }
  }
  
  /*********************************************************
    Start / Stop / Reset slider
  *********************************************************/
  var timer = null;

  this.start = function () {
    timer = setTimeout(
      ref.slideNext,
      settings.slide_delay
    );
  }
  
  this.stop = function () {
    clearInterval( timer );
  }
  
  this.reset = function () {
    this.stop();
    if(settings.auto_slide) { this.start(); }
  }
  
  /*********************************************************
    Events
  *********************************************************/
  
  // array of registered objects
  var registered = [];
  
  // adds an element to the registered objects
  this.register = function (obj) {
    registered.push(obj);
  }
  
  // trigger an event to registered object
  var notify = function (evName, params) {
    for( var i=0;i<registered.length;i++) {
      registered[i].trigger(evName, params);
    }
  }
    
}

