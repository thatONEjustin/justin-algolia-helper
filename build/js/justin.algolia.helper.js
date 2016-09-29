// Justin's Fancy Schmancy Algolia Plugin
// Version: 1.0.0
// Using - A boilerplate for jumpstarting jQuery plugins development by Stefan Gabos version 1.1, May 14th, 2011



//@TODO: There is a bug with how the results list works. Currently it outputs on the results per search. This will get super unoptimized.
//@TODO: Will be solving how $results is built. Using the proper jquery
//       method of attaching the plugin to dom elements, we can store the
//       appropriate index and hit per page information in data-* attribs
//       not only does this reflect angular/react style workflows
//       it also eliminates the entire indices object that needs to be passed
//       into the plugin.

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
            searchForm: '.search'
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
            //Check for required appID and apiKey options.
            setupAlgolia();
            //setupFormListeners();
            // init the rest of the plugin features below

        }

        // public methods
        // these methods can be called like:
        // plugin.methodName(arg1, arg2, ... argn) from inside the plugin or
        // element.data('FancyAlgolia').publicMethod(arg1, arg2, ... argn) from outside
        // the plugin, where "element" is the element the plugin is attached to;

        // a public method. for demonstration purposes only - remove it!
        plugin.foo_public_method = function() {

            // code goes here

        }

        // private methods
        // these methods can be called only from inside the plugin like:
        // methodName(arg1, arg2, ... argn)

        // a private method. for demonstration purposes only - remove it!
        var setupAlgolia = function() {

            //Check to see if the user provided the api Key and app ID
            if( $.trim(plugin.settings.appID) === '' || $.trim(plugin.settings.apiKey) === '' ) {
                $.trim(plugin.settings.appID) === '' && console.log('appID is not present');
                $.trim(plugin.settings.apiKey) === '' && console.log('apiKey is not present');
            } else {
                //If the user DID input these two required fields, then assign the ID/Key to the client
                //and build helpers
                plugin.settings.client = algoliasearch(plugin.settings.appID, plugin.settings.apiKey);

                //console.log(plugin.settings);

                buildHelpers();
                //buildSearchResults();
            }

            // code goes here
            if(plugin.settings.debug) {

                $input = $('#q');

                $input.bind('keyup paste', searchIndices);
            }

            search('init');
        }

        var buildHelpers = function () {

            console.log('buildHelpers()');

            for(var a=0; a<plugin.settings.index.length; a++) {
                try {
                    var asHelper = algoliasearchHelper(plugin.settings.client, plugin.settings.index[a], {
                        hitsPerPage: plugin.settings.hitsPerPage
                    })

                    plugin.settings.helpers[plugin.settings.index[a]] = {
                        helper: asHelper,
                        hittemplate: Hogan.compile($('#' + plugin.settings.id +'-template').text())
                    }

                } catch (err) {
                    console.log(err.message);
                }
            }

            for(var key in plugin.settings.helpers) {
                try {

                    plugin.settings.helpers[key].helper.on('result', function (content) {
                        console.log(content);
                    });

                } catch (err) {
                    console.log(err.message);
                }
            }
        }

        var renderHits = function (data, theHelper, container) {

            try {

                //Where to display all resulting hits.
                var $results = $element.find(plugin.settings.resultsId);

                //console.log($results[0].parentElement);

                //If HTML entities exist, this should convert them to the proper text for the browser to render
                var html = $('<textarea/>').html(theHelper.hittemplate.render(data)).text();

                if(plugin.settings.smoothLoad) {

                    $results.animate({opacity: 0}, plugin.settings.displaySpeed, function () {
                        $(this).html('');

                        $results.append(html);

                        $(this).animate({opacity: 1}, plugin.settings.displaySpeed);
                    });

                } else {
                    $results.html('');
                    $results.append(html);
                }

                var $counter = $element.find('.count');

                if($counter.length && data.nbHits > 0) {
                    $counter.html('');
                    $counter.html(data.nbHits);
                } else {
                    $element.find('.error').html('');
                    $element.find('.error').html('<center>No <strong>' +  capitalizeFirstLetter(section) + ' Results </strong></strong>');
                }

            } catch (err) {
                console.log(err.message);
            }


        }

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
                    //console.log(query);
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
