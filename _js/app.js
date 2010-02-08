/*!
 * Copyright 2010, Brandon Aaron (http://brandonaaron.net/)
 * Licensed under the MIT license: LICENSE.txt.
 */

var jqtouch = new $.jQTouch({
    icon: 'icon.png',
    addGlossToIcon: false,
    startupScreen: 'startup.png',
    statusBar: 'black',
    slideSelector: '#jqt .page ul a'
});

$.fn.scrollable = function() {
    return this.each(function() {
        $.data(this, 'scrollable', new Scrollable(this));
    });
};

$(function(){
    if (!('evaluate' in document) && !('localStorage' in window)) {
        $('div.info').text('Sorry, your browser does not have the capabilities to run this web app.');
        return;
    }
    
    window.applicationCache.addEventListener('downloading', function() {
        $('#jqt').addClass('downloadingupdate');
    }, false);
    window.applicationCache.addEventListener('updateready', function() {
        $('#jqt').removeClass('downloadingupdate').addClass('updateready');
        $('#home').find('.updateready').bind('click tap', function() {
            window.location.reload();
        });
    }, false);
    jqtouch.checkForUpdates();
    
    $('#home').find('form').bind('submit', function(event) {
        var $input = $('input', this),
            val = $('input', this).val();
        if (val) {
            apiDocs.search(val);
        }
        $input.val('');
        return false;
    });
    
    $('a').live('tap click', function(event) {
        var $this = $(this);
        if ($this.is('.entry')) {
            var name = $this.attr('data-name'),
                index = $this.attr('data-index');
            apiDocs.showEntry(name, index);
            return false;
        }
        if ($this.is('.category')) {
            var name = $this.attr('data-name');
            apiDocs.showCategory(name);
            return false;
        }
        if ($this.is('.home')) {
            jqtouch.goBack('#home');
            return false;
        }
    });
    
    $('#jqt').find('.scrollable').scrollable();
    
    window.apiDocs = new APIDocs();
    apiDocs.getXML({
        success: function() {
            jqtouch.goTo('#home', 'fade');
        },
        error: function() {
            jqtouch.goTo('#error', 'fade');
        }
    });
});

