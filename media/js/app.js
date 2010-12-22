//
// Javascript definition for the Hunch gifts app
//

var INIT = (function($, undefined) {

    // variables
    var user_id,
        recommend_url,
        topic_ids,
        num_predictions,
        paginator,
        twitter_name,
        num_friends,
        user_tags = [],
        used_tags = [],
        used_recs = [],
        current_recs = [],
        used_faces = [],
        likes = [],
        dislikes = [],
        get_recs_cache = {},
        recommended_users = [["gattis", "hn_6"], ["kelly", "hn_16"], ["travis", "hn_22013"], ["hikikomori", "hn_43403"], ["w3aponx", "hn_304444"], ["dierock", "hn_1542444"], ["coachdlg", "hn_1555454"], ["chavahn", "hn_1576473"], ["chrisfbt1", "hn_1622574"], ["aklemmer", "hn_1622713"], ["artxruss", "hn_1623843"], ["steelmagnoliahi", "hn_1635073"], ["wappple", "hn_1789934"], ["jenward", "hn_1896954"], ["terilacey", "hn_1899944"], ["jrinpdx", "hn_1963624"], ["stevenjones1999", "hn_1984634"], ["elisheva", "hn_2000564"], ["sachertorte", "hn_2001691"], ["niemira", "hn_2019541"], ["ccaple", "hn_2036021"], ["susan2u", "hn_2150521"], ["lindegren", "hn_2363424"], ["chriswilliams", "hn_2364644"], ["iagol", "hn_2372634"], ["chuckgee", "hn_2380974"], ["frankowen1", "hn_2382284"], ["davidwillmore", "hn_2400784"], ["cmndrzack", "hn_2407354"], ["carlleemcurran", "hn_2409374"], ["benjamin-lerner", "hn_2413684"], ["jwmu311", "hn_2439834"], ["crichter", "hn_2441394"], ["mketcham", "hn_2446974"], ["jharlow", "hn_2487814"], ["cory-reynolds", "hn_2488724"], ["bcarter-allen", "hn_2493384"], ["peter-welsh", "hn_2527544"], ["simongoldfeder", "hn_2538424"], ["terry_reed", "hn_2632634"], ["bryanvila", "hn_2638844"], ["jamesjmartin4", "hn_2646904"], ["cscornette", "hn_2653124"], ["kingandy", "hn_2666824"], ["pallasch", "hn_2681174"], ["yahya", "hn_2682324"], ["ernestjwiyanto", "hn_2684774"], ["ptrindade", "hn_2693044"], ["ben-moore", "hn_2716494"], ["louiseann", "hn_2716904"], ["boyfromsi", "hn_2741984"], ["tretera", "hn_2768354"], ["psychosulk", "hn_2837854"], ["rachelluray", "hn_2851671"], ["cbutelli", "hn_2872931"], ["pwinarsky", "hn_3379301"], ["christyventers", "hn_3691584"], ["jacobjavits", "hn_3796331"], ["abigail-wadsworth", "hn_3869104"]];

    //
    // utils
    //

    function createCookie(name,value,path,days) {
	if (days) {
	    var date = new Date();
	    date.setTime(date.getTime()+(days*24*60*60*1000));
	    var expires = "; expires="+date.toGMTString();
	}
	    else var expires = "";
	document.cookie = name+"="+value+expires+"; path=" + path;
    }

    function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
	    var c = ca[i];
	    while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
    }

    function eraseCookie(name) {
	createCookie(name,"",-1);
    }

    function cookieAsArray(cookie_name) {
        var vals = readCookie(cookie_name);
        if (vals != null) {
            return vals.split(',');
        } else {
            return [];
        }
    }

    function suppressHttpErrors(params) {
        params['suppress_http_errors'] = 1;
    }

    function truncate(text, max) {
        max = max || 250;
        if (text && text.length > max) {
            return text.substring(0, max) + '...';
        }
        return text;
    }

    function augmentQueryString(params, url) {
        var queryParams = parseQueryString(url);
        for (var param in params) {
            queryParams[param] = params[param];
        }
        var components = [];
        for (param in queryParams) {
            components.push(encodeURIComponent(param) + '=' + encodeURIComponent(queryParams[param]));
        }
        return components.join('&');
    }

    function parseQueryString(url) {
        if (url == undefined || url == '') {
            url = window.location.search;
        }
        var result = {}, position, queryString, hashPos;
            if ((position = url.indexOf("?")) == -1) {
                return result;
            }
        position += 1;
        hashPos = url.indexOf("#");
        if (hashPos != -1) {
            queryString = url.substring(position, hashPos);
        } else {
            queryString = url.substring(position);
        }
        queryString = queryString.replace(/\+/g, ' ');
        var queryComponents = queryString.split(/[&;]/g);
        for (var i = 0; i < queryComponents.length; i++){
            var keyValuePair = queryComponents[i].split('=');
            var key = decodeURIComponent(keyValuePair[0]);
            var value = decodeURIComponent(keyValuePair[1]);
            if (!result[key]) result[key] = [];
            result[key].push((keyValuePair.length == 1) ? '' : value);
        }
            return result;
    }


    //
    // Recommendations
    //

    // Renders recommendations in .activities

    function clearCache() {
        used_tags = [],
        used_recs = [],
        current_recs = [],
        used_faces = [],
        get_recs_cache = {};
    }

    function doFaces(data) {
        $.each(data.results, function(i, e) {
            var counter = 0,
                max_count = 5,
                current_faces = [],
                items = e.preferences,
                a_str = '<a class="fixed-media imga" clktype="user-face" arg1="{{user_id}}" style="height:36px; width: 36px; margin-right: 10px;" href="{{user_url}}"><img title="{{user_name}}" fullsource="{{user_image_url}}" src="{{temp_img}}" /></a>';
            $(items).each(function(i, e2) {
                if (counter >= max_count) {
                    return -1;
                }
                if (e2.user_image_url.indexOf('1g3-766493._cf50_50.png') != -1) {
                    // make sure that the user has an image
                    // TODO(gleitz): make more robust?
                    return -1;
                }
                for (var tag in current_faces) {
                    if (e2.user_id == current_faces[tag]) {
                        return -1;
                    }
                }
                e2.temp_img = $.imageScaleLoader.defaults.placeholderUrl;
                $('#similarpeople-' + e.result_id).append(Mustache.to_html(a_str, e2));
                current_faces.push(e2.user_id);
                counter += 1;
            });
            while (counter < max_count) {
                recommended_users.sort(function() {return 0.5 - Math.random();});
                for (var rec_user in recommended_users) {
                    var possible_user_id = recommended_users[rec_user][1];
                    var possible_user_name = recommended_users[rec_user][0];
                    if (counter >= max_count) {
                        break;
                    }
                    var used = false;
                    for (var tag in current_faces) {
                        if (possible_user_id == current_faces[tag]) {
                            used = true;
                        }
                    }
                    if (used) {
                        continue;
                    }
                    var user = {
                        user_id: possible_user_id,
                        user_url: 'http://hunch.com/people/'+ possible_user_name + '/',
                        user_image_url: 'http://hunch.com/people/'+ possible_user_id + '/picture/?type=square',
                        user_name: possible_user_name

                    };
                    user.temp_img = $.imageScaleLoader.defaults.placeholderUrl;
                    $('#similarpeople-' + e.result_id).append(Mustache.to_html(a_str, user));
                    current_faces.push(user.user_id);
                    counter += 1;
                }
                break;
            }
            $('#similarpeople-' + e.result_id).find('.fixed-media img').imageScaleLoader({width: 36, height: 36, src: 'fullsource'});
            if ($('#similarpeople-' + e.result_id).find('.fixed-media').length == 0) {
                $('#similarpeople-' + e.result_id).hide();
            }
            showExtras(e.result_id);
        });
    }

    function refreshRecs(silent) {
        if (!silent) {
            $('.activities').html('<img style="padding: 8px;" src="/media/img/loader.gif" alt="" />');
        }
        var responseData = {
            friend_id: twitter_name,
            topic_ids: 'all_394864', // Hunch gifts (http://hunch.com/developers/v1/topics/)
            popularity: 0,
            limit: paginator.getFauxLimit(),
            offset: paginator.getOffset()
        };
        var page = paginator.page,
            limit = paginator.getFauxLimit(),
            price = $('#filters').find('select').val();

        if (price) {
            price = price.split('-');
            if (price[0]) responseData.min_price = price[0];
            if (price[1]) responseData.max_price = price[1];
        }

        function refreshRecsSuccess(data, textStatus) {
            if (!data.ok) {
                if (data.error_code == 5) {
                    $('.content').html('<h3>Unknown Twitter name @' + data.key + '.<br/>Check your spelling and try again.</h3>');
                    $('.products-head').hide();
                    $('#beta').hide();
                } else {
                    ajaxError(data, textStatus);
                }
            }
            paginator.fixFauxData(data, data.recommendations);
            getRecommendations(data, limit);
        }
        suppressHttpErrors(responseData);
        responseData['wildcards'] = 1;
        responseData['likes'] = readCookie('likes') || '';
        responseData['dislikes'] = readCookie('dislikes') || '';
        responseData['key'] = twitter_name.replace('tw_', '');

        Hunch.api.getRecommendations(responseData, refreshRecsSuccess);
    };

    function getRecommendations(data, limit) {
        if (data.recommendations == undefined || data.recommendations.length == 0) {
            $('.activities').text("Sorry, no recommendations");
        } else {
            $('.activities').html('');

            paginator.update('.pagination', function() { clearCache(); refreshRecs(); }, data.dynamic_total || data.total);
            topic_ids = data.topic_ids;
            var count = 0;
            $.each(data.recommendations, function(i, e) {
                if (count >= limit) {
                    return -1;
                }
                used_recs.push(e.result_id);
                current_recs.push(e.result_id);
                count += 1;
                e.is_last = ((i == data.recommendations.length - 1) || ((limit != undefined) && (i == limit - 1)));
                e.last_class = ' product-last';
                e.active_class = ' light-active';
                e.description = truncate(e.description);
                e.url = e.affiliate_links.length ? e.affiliate_links[0].url : e.url;
                e.merchant_name = e.affiliate_links.length ? e.affiliate_links[0].title : 'Hunch';
                var p = e.affiliate_links.length ? e.affiliate_links[0].price : e.price;
                if (p) {
                    p = (''+p).split('.');
                    e.price_dec = p[1];
                    e.price_int = p[0] || '0';
                    if (e.price_dec && e.price_dec.length == '1') {
                        e.price_dec += '0';
                    }
                    if (e.price_int.length > 3) {

                        p = e.price_int;

                        var result = new Array(p.length), l = p.length, i;

                        for (i=l-1; i>=0; i--) {
                            result[i] = p.charAt(i) + ((l-1-i)%3 || i==l-1 ? '' : ',');
                        }

                        e.price_int = result.join('');
                    }
                } else {
                    e.price_int = '';
                    e.price_dec = '';
                }
                var likes = cookieAsArray('likes'),
                dislikes = cookieAsArray('dislikes');
                for (var like in likes) {
                    if (e.result_id == likes[like]) {
                        e.liked = true;
                    }
                }
                for (var dislike in dislikes) {
                    if (e.result_id == dislikes[dislike]) {
                        e.disliked = true;
                    }
                }
                e.twitter_name = twitter_name.replace('tw_', '');
                e.temp_img = $.imageScaleLoader.defaults.placeholderUrl;
                $('.activities').append(Mustache.to_html('<div id="item-{{result_id}}" class="item-all"><div class="item-all-inner">\
<div class="image">\
<a class="media" clktype="item" arg1="{{result_id}}" href="{{url}}">\
<img height="142" width="142" class="rec-img" fullsource="{{image_url}}" src="{{temp_img}}" />\
</a>\
</div>\
<div class="description">\
<h3 style="height: 18px; overflow: hidden"><a class="clk-trk" clktype="item" arg1="{{result_id}}" href="{{url}}">{{name}}</a></h3>\
<p>\
<a class="atxt" clktype="item" arg1="{{result_id}}" href="{{url}}">{{description}}</a>\
</p>\
<div class="clr">\
<div id="loading-message" style="padding: 9px 0;">\
</div>\
<div id="loaded-results" class="hide">\
<div class="right" style="padding: 9px 0 0 0; width: 150px; height: 54px;" id="similaritems-{{result_id}}">\
<div class="dim right" style="clear: both;">Related items</div>\
<div class="sim-items" class="right" style="width: 100%; clear: both;"></div>\
</div>\
<div class="left" style="padding: 9px 0 0 0; height: 54px; overflow: hidden;" id="similarpeople-{{result_id}}">\
<div class="dim">People who would like this</div>\
</div>\
<div class="left tags" style="clear:both; width: 360px; height: 36px; overflow: hidden;" id="similartags-{{result_id}}">\
</div>\
</div>\
</div>\
</div>\
<div class="feedback">\
<div class="rate">\
<button style="margin-right: 3px;" class="light yes{{#liked}}{{active_class}}{{/liked}}" id="yes-{{result_id}}">\
<span>Like</span>\
</button>\
<button class="light no{{#disliked}}{{active_class}}{{/disliked}}" id="no-{{result_id}}">\
<span>Dislike</span>\
</button>\
</div>\
<div class="br-top">\
{{#price}}<a clktype="item" arg1="{{result_id}}" href="{{url}}" class="price-text">${{price_int}} <span style="font-size: 12px;"><br/>from {{merchant_name}}</span></a>\
<br/>{{/price}}\
<br/>\
</div>\
    </div>\
</div>\
</div>', e));
                var good_topic_ids = [];
                for (var topic_id in e.topic_ids) {
                    if (e.topic_ids[topic_id].indexOf('hn_t') != -1) {
                        good_topic_ids.push(e.topic_ids[topic_id]);
                    }
                }
                var params = {topic_ids: good_topic_ids.join(','), friend_id: twitter_name, limit: 60, key: e.result_id, suppress_http_errors: 1};
                Hunch.api.getRecommendations(params, populateSimilarItems);
                if (e.is_last) {
                    $('.activities').find('img.rec-img').imageScaleLoader({width: 142, height: 142, src: 'fullsource'});
                }
            });
            var params = {result_ids: current_recs.join(','), include_activity: 1};
            Hunch.api.getResults(params, doFaces);
        }
    }

    function populateSimilarItems(data, textStatus) {
        var items = data.recommendations;
        if (data.recommendations == undefined) {
            console.log(data);
        }
        if (items.length == 0) {
            $('#similaritems-' + data.key).empty();
        } else {
            var query_string = "?" + augmentQueryString(),
                count = 0;

            $.each(items, function(i, e) {
                if (count >= 3) {
                    return -1;
                }
                for (var item in used_recs) {
                    if (used_recs[item] == e.result_id) {
                        return -1;
                    }
                }
                count += 1;
                used_recs.push(e.result_id);
                e.is_first = i == 0;
                e.query_string = query_string;
                e.temp_img = $.imageScaleLoader.defaults.placeholderUrl;
                $(Mustache.to_html('<a class="fixed-media imga right" clktype="sim-item" arg1="{{result_id}}" style="height:36px; width: 36px; margin-left: 10px;" href="{{url}}"><img title="{{name}}" fullsource="{{image_url}}" src="{{temp_img}}" /></a>', e)).appendTo('#similaritems-' + data.key + ' .sim-items');
            });
            $('#similaritems-' + data.key).find('.fixed-media img').imageScaleLoader({width: 36, height: 36, src: 'fullsource'});
        }
    }

    function ajaxError(data, textStatus) {
        $('div.page-error').remove();
        var message;
        if (data && data.reason == "timeout") {
            message = 'The request timed out, please refresh the page and try again.';
        } else {
            message = (textStatus  == 'timeout' ? 'The request timed out, please refresh the page and try again.' : 'There was an error, please refresh the page and try again.');
        }
        $('body').append($('<div>', {
            'class': 'page-error',
            text: message
        }));
    }

    // Handle feedback
    function setFeedback(evt) {
        evt.preventDefault();
        var $t = $(this),
        parent = $t.closest('.rate'),
        id = $t.attr('id').split('-').pop();

        if (parent[0].clicked) return;
        parent[0].clicked = true;
        function feedbackSuccess(data, textStatus) {
            if (!data.ok) {
                ajaxError(data, textStatus);
            }
            $t.closest('.rate').text('Thank you!');
            var key_name = '';
            if ($t.hasClass('yes')) {
                key_name = 'likes';
            } else {
                key_name = 'dislikes';
            }
            var existing_vals = readCookie(key_name);
            if (existing_vals != null) {
                existing_vals = existing_vals.split(',');
            } else {
                existing_vals = [];
            }
            existing_vals.push(id);
            createCookie(key_name, existing_vals.join(','), '/gifts/' + twitter_name.replace('tw_', '') + '/', 120);
            if (!($t.hasClass('yes'))) {
                // reload recs for a 'no'
                refreshRecs(true);
            }
        }
        feedbackSuccess({ok: true}, true);
    }

    function searchUserSubmit(evt) {
        if (evt) evt.preventDefault();
        var $input = $('#id_find_friend'),
            val;
        if (!$input.hasClass('placeholder')) {
            val = $.trim($input.val());
            val = val.replace(/[^0-9A-z_]/g, ''); // only allow valid twitter usernames
            window.location.href = recommend_url + (val ? val + '/': '');
        }
    }

    function showExtras(key) {
        $('#loading-message', '#item-' + key).hide();
        $('#loaded-results', '#item-' + key).show();
    }

    return {
        recommend: function(_twitter_name, _recommend_url, _num_friends, _num_predictions, _page_cfg) {
            $.imageScaleLoader.preload();
            $('#id_find_friend').placeholder();
            $('#container').scrollTop(0);
            twitter_name = 'tw_' + _twitter_name;
            recommend_url = _recommend_url;
            num_friends = _num_friends;
            num_predictions = _num_predictions;
            paginator = new Pagination(_page_cfg, $);
            refreshRecs();
            var mouse_timer;
            $('.activities').delegate('button.yes, button.no', 'click', setFeedback);

            // price filtering
            $('#filters').find('select').change(function() { clearCache(); paginator.page = 1; refreshRecs(); });

            $("#search-friends").submit(searchUserSubmit);
        },
        intro: function(_base_url) {
            $.imageScaleLoader.preload();
            recommend_url = _base_url;
            $('#id_find_friend').placeholder();
            $('#search-friends').submit(searchUserSubmit);
        }
    };
})(jQuery);

//
// Image loading and resizing jQuery plugin
//
(function($) {

    $.imageScaleLoader = {
        defaults: {
            width: 100,
            height: 100,
            placeholderUrl: '/media/img/t.png',
            src: 'src',
            didAttr: '_imageScaleLoader'
        },
        preload: function(placeholderUrl) {
            (new Image).src = placeholderUrl || this.defaults.placeholderUrl;
        }
    };

    $.fn.imageScaleLoader = function(cfg) {

        cfg = $.extend({}, $.imageScaleLoader.defaults, cfg);

        return this.each(function() {
            var image = new Image(),
                $this = $(this),
                src = $this.attr(cfg.src);

            if (src && !$.data(this, cfg.didAttr)) {
                $.data(this, cfg.didAttr, true);

                if ($this.attr(cfg.src) != cfg.placeholderUrl)
                    $this.attr(cfg.src, cfg.placeholderUrl);

                image.onload = function () {
                    var h = this.height,
                        w = this.width,
                        wscale, hscale, scale;

                    if (parseInt(w) > cfg.width || parseInt(h) > cfg.height) {
			            wscale = w / cfg.width;
                        hscale = h / cfg.height;
			            scale = (wscale < hscale ? hscale : wscale);
			            w = w/scale;
                        h = h/scale;
		            }

                    $this.attr('src', this.src)
                        .attr('width', parseInt(w))
                        .attr('height', parseInt(h));
                };

                image.src = src;
            }
        });
    };

})(jQuery);