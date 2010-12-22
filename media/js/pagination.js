
var Pagination = function(cfg, $, undefined) {

    //
    // private variables -- //TODO - make this a cfg = {} and extend a defaults object... instead of individual args
    //
    $ = $ || window.jQuery;

    var self = this,
        errormsg = 'typeof last argument undefined is not undefined!',
        defaults = {
            page: 1,
            limit: 10,
            total: null,
            on_sides: 2,
            on_ends: 1,
            simple_cutoff: null,
            show_end: false,
            dot: '…',
            prev_text: 'prev',
            prev_class: 'prev',
            prev_disabled_class: 'prev prev-dim',
            next_text: 'next',
            next_class: 'next',
            next_disabled_class: 'next next-dim',
            html_as_list: false,
            hide_prev: false
        };

    if (typeof undefined !== 'undefined') { throw new Error(errormsg, errormsg); }

    cfg = $.extend({}, defaults, cfg);

    if (cfg.simple_cutoff === null) { //HACK - check show_end to handle unkown total case
        cfg.simple_cutoff = cfg.show_end ? cfg.simple_cutoff || (cfg.on_sides + 2*cfg.on_ends + 2) : cfg.on_sides + 1;
    }


    //
    // public variables
    //
    this.page = cfg.page;
    this.limit = cfg.limit;
    this.total = cfg.total;

    //
    // public methods
    //
    this.render = render;
    this.clickHandler = clickHandler;
    this.update = update;
    this.getOffset = getOffset;
    this.getFauxLimit = getFauxLimit;
    this.fixFauxData = fixFauxData;

    // remove properties from cfg that have been added to `this`
    delete cfg.page;
    delete cfg.limit;
    delete cfg.total;


    //
    // utils
    //
    function range(start, end, array) {
        array = array || [];
        for (; start < end; start++) { array.push(start); }
        return array;
    }

    //
    // methods
    //
    function update(parent_selector, cb, total, limit) {
        if (total !== undefined) self.total = total;
        if (limit !== undefined) self.limit = limit;
        self.clickHandler(
            $(parent_selector).html(self.render(total, limit)),
            cb
        );
        if (self.loadingStop) self.loadingStop(); // loading hook
    }

    function render(total, limit) { //TODO(peter) - figure out how to handle or store these arguments?
        if (total === undefined) total = self.total;
        if (limit === undefined) limit = self.limit;
        if (!total || !limit) return '';

        var page_num = self.page,
            total_pages = Math.ceil(total / limit),
            page_range = [],
            has_previous = page_num > 1,
            has_next = page_num < total_pages,
            pos, extra;

        if (total_pages <= 1) {
            return '';

        } else if (total_pages <= cfg.simple_cutoff) {
            range(0, total_pages, page_range);

        } else {

            if (page_num > (cfg.on_sides + cfg.on_ends + 1)) {
                // left ends
                range(0, cfg.on_ends, page_range);
                page_range.push(cfg.dot);
                pos = total_pages - page_num + 1;
                extra = pos < cfg.on_ends ? cfg.on_ends - pos : 0;
                range(page_num - cfg.on_sides - 1 - extra, page_num, page_range);
            } else {
                // run from left
                range(0, page_num, page_range);
            }

            if (page_num + cfg.on_sides + (cfg.show_end ? cfg.on_ends : 0) >= total_pages) { //HACK - handle unkown total case
                // can extend to right
                range(page_num, total_pages, page_range);
            } else {
                // add dot
                extra = page_num < cfg.on_ends ? cfg.on_ends - page_num : 0;
                range(page_num, page_num + cfg.on_sides + extra, page_range);
                page_range.push(cfg.dot);
                if (cfg.show_end) {
                    range(total_pages - cfg.on_ends, total_pages, page_range);
                }
            }
        }

        var l = page_range.length,
            html = $.map(page_range, function(x, i) {
                if (x == cfg.dot) return '<span>' + cfg.dot + '</span>';
                return x + 1 == page_num ? '<em>' + (x+1) + '</em>' : '<a href="#">' + (x+1) + '</a>';
            }),
            prev = has_previous ? '<a href="#" class="'+cfg.prev_class+'">'+cfg.prev_text+'</a>' : '<span class="'+cfg.prev_disabled_class+'">'+cfg.prev_text+'</span>',
            next = has_next ? '<a href="#" class="'+cfg.next_class+'">'+cfg.next_text+'</a>' : '<span class="'+cfg.prev_disabled_class+'">'+cfg.next_text+'</span>';

        html = cfg.html_as_list ? '<li>' + html.join('</li><li>') + '</li>' : html.join('');
        return (
            ((cfg.hide_prev && page_num == 1) ? '' : (cfg.html_as_list ? '<li>' + prev + '</li>' : prev)) +
                html +
                (cfg.html_as_list ? '<li class="last">' + next + '</li>' : next)
            );
    };

    function clickHandler($elt, cb) {
        $elt.find('a').click(function(evt) {
            evt.preventDefault();
            var $t = $(this), text, doit = false;
            if ($t.hasClass('prev')) {
                self.page--;
                doit = true;
            } else if ($t.hasClass('next')) {
                self.page++;
                doit = true;
            } else if ((text = $t.text()) && /\d+/.test(text)) {
                self.page = parseInt(text);
                doit = true;
            }

            if (doit) {
                if (self.loadingStart) self.loadingStart(); // loading hook
                Hunch.scrollTop();
                $(window).trigger('paginate', [self.page]);
                return cb(self);
            }
        });
    };

    function getOffset() {
        return (self.page - 1) * self.limit;
    }

    function getFauxLimit() { // offset size + extra lookup
        return getOffset() + (1 + cfg.on_sides) * self.limit + 1;
    };

    function fixFauxData(data, results) { // adds dynamic total to the data and shortens the results to proper length
        data.dynamic_total = getOffset() + results.length;
        if (results.length) {
            results.splice(self.limit, results.length);
        }
    }
};
