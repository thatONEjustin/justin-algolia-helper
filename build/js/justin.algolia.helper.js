// Justin's Fancy Schmancy Algolia Plugin
// Version: 1.0.0
// Using - A boilerplate for jumpstarting jQuery plugins development by Stefan Gabos version 1.1, May 14th, 2011

//@TODO: now incorporating <form> functionality. 
//       The "basic" version of this form will use a single input[type="text"].
//       The "advanced" version of this will mimic instantsearch.js, utilizing an 
//       .addWidget() function that will tie an input field to facets.

(function($) {

    // here we go!
    $.FancyAlgolia = function(element, options) {

        // plugin's default options
        // this is private property and is  accessible only from inside the plugin
        var defaults = {
            debug: true,
            smoothLoad: true,
            client: '',
            helpers: [],
            helpersFunctions: [],
            resultsId: '.hits',
            displaySpeed: 150,
            searchForm: $('.FancyAlgoliaSearch')
        }

        // to avoid confusions, use "plugin" to reference the
        // current instance of the object
        var plugin = this;

        // this will hold the merged default, and user-provided options
        // plugin's properties will be available through this object like:
        // plugin.settings.propertyName from inside the plugin or
        // element.data('FancyAlgolia').settings.propertyName from outside the plugin,
        // where "element" is the element the plugin is attached to;
        plugin.settings = {
            appID: '',
            apiKey: '',
            resultsId: '',
            debug: '',
            smoothLoad: '',
            displaySpeed: '',
            searchForm: ''
        }

        var $element = $(element), // reference to the jQuery version of DOM element
             element = element;    // reference to the actual DOM element

        // the "constructor" method that gets called when the object is created
        plugin.init = function() {
            // the plugin's final properties are the merged default and
            // user-provided options (if any)
            plugin.settings = $.extend({}, defaults, options);

            plugin.settings.id = $element.attr('id');
            plugin.settings.index = $element.attr('data-index').split(',');
            plugin.settings.hitsPerPage = Number($element.attr('data-hitsPerPage'));
            plugin.settings.hittemplate = $('#' + $element.attr('data-hittemplate'));

            // init the rest of the plugin features below
            try {
                plugin.settings.client = algoliasearch(plugin.settings.appID, plugin.settings.apiKey); 
            } catch(err) {
                console.log(err.message);
                console.log('invalid apiKey or appID');
            }            
            
            if(plugin.settings.debug) {
                $input = $('#q');

                $input.bind('keyup paste', searchIndices);
            }

            buildHelpers();

            search('init');
        }

        // public methods
        /*plugin._public_method = function() {

            // code goes here

        }*/

        // private methods
        var buildHelpers = function () {

            for(var a=0; a<plugin.settings.index.length; a++) {
                try {
                    var asHelper = algoliasearchHelper(plugin.settings.client, plugin.settings.index[a], {
                        hitsPerPage: plugin.settings.hitsPerPage
                    })

                    plugin.settings.helpers[plugin.settings.index[a]] = {
                        helper: asHelper,
                        hittemplate: Hogan.compile(plugin.settings.hittemplate.text())
                    }

                } catch (err) {
                    console.log(err.message);
                }
            }

            for(var key in plugin.settings.helpers) {
                try {

                    plugin.settings.helpers[key].helper.on('result', function (content) {
                        
                        renderHits(content, plugin.settings.helpers[key], $element.find(plugin.settings.resultsId));
                    });

                } catch (err) {
                    console.log(err.message);
                }
            }
        }

        var renderHits = function (data, theHelper, $container) {

            try {
                //If HTML entities exist, this should convert them to the proper text for the browser to render
                var html = $('<textarea/>').html(theHelper.hittemplate.render(data)).text();

                if(plugin.settings.smoothLoad) {

                    $container.animate({opacity: 0}, plugin.settings.displaySpeed, function () {
                        $(this).html('');

                         $container.append(html);

                        $(this).animate({opacity: 1}, plugin.settings.displaySpeed);
                    });

                } else {
                     $container.html('');
                     $container.append(html);
                }

            } catch (err) {
                console.log(err.message);
            }


        }

        //@TODO: Cleanup how these are stored. Consider storing in plugin.settings
        var query = '';
        var $input;

        var search = function (when) {
            switch(when) {
                case 'init':
                    //console.log('init');
                    for(var index in plugin.settings.helpers) {
                        plugin.settings.helpers[index].helper.search();
                    }
                break;

                default:
                    //console.log('default');
                    for(var index in plugin.settings.helpers) {
                        plugin.settings.helpers[index].helper.setQuery(query).search();
                    }
            }
        }

        var clean = function () {
            for (var index in plugin.settings.helpers) {
                $element.find(plugin.settings.resultsId).empty();
            }
        }

        var searchIndices = function (e) {
            query = $input.val();
            clean();
            search();
        }

        var capitalizeFirstLetter = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        // fire up the plugin!
        // call the "constructor" method
        plugin.init();

    }

    // add the plugin to the jQuery.fn object
    $.fn.FancyAlgolia = function(options) {

        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function() {

            // if plugin has not already been attached to the element
            if (undefined == $(this).data('FancyAlgolia')) {

                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.FancyAlgolia(this, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                // you can later access the plugin and its methods and properties like
                // element.data('FancyAlgolia').publicMethod(arg1, arg2, ... argn) or
                // element.data('FancyAlgolia').settings.propertyName
                $(this).data('FancyAlgolia', plugin);

            }

        });

    }

})(jQuery);
