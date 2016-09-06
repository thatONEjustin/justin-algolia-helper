(function ($) {
    $.fn.asnetAlgolia = function ( options ) {

        var client = algoliasearch(options.appID, options.apiKey);
        var indices = options.resultIndices;

        var settings = $.extend({
            input: $('#q'),
            reset: $('.resetSearch'),
            container: '',
            debug: false,
            smoothLoad: true      
        }, options);
        
        var $input     = settings.input;
        var $reset     = settings.reset;
        var debug      = settings.debug;
        var smoothLoad = settings.smoothLoad;

        var container  =  settings.container;

        var helpers = [];
        var helperResultsFunc = [];

        var query = '';

        function buildHelpers() {
            for (var key in indices) {
                var tmp_helper = algoliasearchHelper(client, indices[key].indexName, {
                    hitsPerPage: indices[key].hitsPerPage
                });

                helpers[key] = {
                    helper: tmp_helper,
                    container: '#' + key,
                    hittemplate: indices[key].hittemplate
                };
            };

            for(var index in helpers) {
                if(helpers[index].hittemplate) {
                    helperResultsFunc[index] = (function (index){
                        helpers[index].helper.on('result', function (content) {

                            debug == true && console.log(content);
                            
                            renderHits(content, helpers[index], index);
                        });
                    }(index));
                }
            }
        }

        function renderHits(data, theHelper, section) {
            try {

                var $results = $(theHelper.container + ' .hits');
                //var html = $(theHelper.hittemplate.render(data));
                var html = $('<textarea/>').html(theHelper.hittemplate.render(data)).text();
                
                if(smoothLoad) {
                    $results.animate({opacity: 0}, 150, function() {
                        $(this).html('');
                        
                        $results.append(html);

                        $(this).animate({opacity: 1}, 150);
                    });
                } else {
                    $results.html('');
                    $results.append(html);
                }
                    

                var $counter = $(theHelper.container + ' .count');
                
                if(data.nbHits != 0 && ($counter)) {                    
                    $counter.html('');
                    $results.removeClass('hide');
                    $counter.html(data.nbHits);
                    $(theHelper.container + ' .search-more').removeClass('hide');
                    $(theHelper.container + ' .error').addClass('hide');
                    $(theHelper.container + ' .error').html('');
                } else {
                    //$results.addClass('hide');
                    $(theHelper.container + ' .error').removeClass('hide');
                    $(theHelper.container + ' .error').html('<center>No <strong>' +  capitalizeFirstLetter(section) + ' Results </strong></strong>');
                    $(theHelper.container + ' .search-more').addClass('hide');
                }
                
            } catch (err) {
                console.log(err.message);
            }
        }

        function searchIndices(e) {
            query = $input.val();
            clean();
            search();
        }

        function search(when) {
            switch(when) {
                case 'init':                           
                    for (var index in helpers) {
                        helpers[index].helper.search();
                    } 
                break;

                case 'reset':
                    clean();
                    for(var index in helpers) {
                        helpers[index].helper.setQuery('').search();
                        $input.val('');
                    }
                break;

                default:
                    for(var index in helpers) {
                        helpers[index].helper.setQuery(query).search();
                    }
            }
        }

        function clean() {
            for(var index in helpers) {
                $(helpers[index].container + ' .hits').empty();                
            }
        }

        function resetSearch(e) {
            e.preventDefault();
            search('reset');
        }

        function initSearch() {
            search('init');
            $input.bind('keyup paste', searchIndices);
            $reset.bind('click', resetSearch);
        }

        function init() {
            buildHelpers();            
            initSearch();
        }        

        init();

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }
}(jQuery));
