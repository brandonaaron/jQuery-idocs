/*!
 * Copyright 2010, Brandon Aaron (http://brandonaaron.net/)
 * Licensed under the MIT license: LICENSE.txt.
 */

function APIDocs(settings) {
    this.url = '/api.xml';
}

APIDocs.prototype = {
    setup: function() {
        this.categories = this.select('api/categories/category');
        this.selectors  = this.select('api/entries/entry[@type="selector"]');
        this.versions   = this.select('api/categories/category[@name="Version"]/category');
        this.entries    = this.select('api/entries/entry');
        
        this.templates = {
            categories: $('#tpl-categories').template(),
            entries: $('#tpl-entries').template(),
            entry: $('#tpl-entry').template()
        };
    },
    
    select: function(selector, parent) {
        return this._toArray(document.evaluate(selector, parent || this.xml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null));
    },
    
    getXML: function(obj) {
        $.ajax({
            url: this.url,
            context: this,
            dataType: 'xml',
            beforeSend: function(xhr) {
                xhr.overrideMimeType('text/xml');
            },
            success: function(data, status, xhr) {
                this.xml = xhr.responseXML;
                this.setup();
                obj.success.call(obj.context || this, this);
            },
            error: function(xhr, status, error) {
                this.error(error);
                obj.error.call(obj.context || this, this);
            },
        });
    },

    showCategory: function(name) {
        var id = name && 'category'+this._sanitizeName(name) || 'categories',
            $category = $('#'+id);
        if (!$category.length) {
            var html = this._generateCategory(name, id);
            $(html).appendTo('#jqt').find('.scrollable').scrollable();
        }
        jqtouch.goTo('#'+id, 'slide');
    },

    showEntry: function(name, index) {
        $('#entry').remove();
        var html = this._generateEntry(name, index);
        $(html).appendTo('#jqt').find('.scrollable').scrollable();
        jqtouch.goTo('#entry', 'slide');
    },

    _generateCategory: function(name, id) {
        var subcategories = name ? 
                this.select('/api/categories/category[@name="'+name+'"]/category') :
                this.select('/api/categories/category'),
            data = {
                id: id,
                title: name || 'Categories'
            };
        if (subcategories.length) {
            data.categories = [];
            subcategories.forEach(function(category) {
                var name = category.getAttribute('name');
                data.categories.push({
                    name: name
                });
            });
            this._sortByName(data.categories);
            return this.templates.categories(data, true);
        } else {
            return this._generateEntriesByCategory(name, id);
        }
    },

    _generateEntriesByCategory: function(name, id) {
        var entries = this.select('/api/entries/entry/category[@name="'+name+'"]/..'),
            data = {
                id: id,
                title: name,
                entries: []
            };
        entries.forEach(function(entry, index) {
            var type = entry.getAttribute('type'),
                name = entry.getAttribute('name'), displayName = name;
            if (type === 'method') displayName = name + '()';
            if (type === 'selector') displayName = this._nodeValue(entry, 'sample');
            data.entries.push({
                index: this.entries.indexOf(entry),
                type: type,
                name: name,
                displayName: displayName,
                desc: this._sanitizeDescription(this._nodeValue(entry, 'desc', true))
            });
        }, this);
        this._sortByName(data.entries)
        return this.templates.entries(data, true);
    },

    _generateEntry: function(name, index) {
        var entry = this.entries[index],
            type = entry.getAttribute('type'),
            name = entry.getAttribute('name'),
            displayName = type === 'selector' ? this._nodeValue(entry, 'sample') : type === 'method' ? name + '()' : name;
            signatures = [].slice.call(entry.getElementsByTagName('signature')),
            examples = [].slice.call(entry.getElementsByTagName('examples')),
            data = {
                id: 'entry',
                title: displayName,
                name: name,
                displayName: displayName,
                desc: this._nodeValue(entry, 'desc', true),
                longdesc: this._nodeValue(entry, 'longdesc', true),
                returns: entry.getAttribute('return'),
                signatures: [],
                examples: []
            };
        
        if (type === 'method') {
            signatures.forEach(function(signature, index) {
                var sig = {
                    title: name + '(',
                    added: this._nodeValue(signature, 'added', true),
                    arguments: []
                };
                var arguments = [].slice.call(signature.getElementsByTagName('argument'));
                arguments.forEach(function(argument, index) {
                    var sigName = argument.getAttribute('name'),
                        optional = !!argument.getAttribute('optional');
                    sig.arguments.push({
                        name: sigName,
                        type: argument.getAttribute('type'),
                        optional: optional,
                        desc: this._nodeValue(argument, 'desc', true)
                    });
                    if (optional) sig.title += '[';
                    sig.title += sigName;
                    if (optional) sig.title += ']';
                    sig.title += ', ';
                }, this);
                sig.title = sig.title.replace(/, $/, '') + ')';
                data.signatures.push(sig);
            }, this);
        }
        return this.templates.entry(data, true);
    },
    
    _sortByName: function(array) {
        return array.sort(function(a, b) {
            a = a.name.replace(/^jQuery\./, '');
            b = b.name.replace(/^jQuery\./, '');
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
    },
    
    _toArray: function(xpathresult) {
        var nodes = [], node, index = 0;
        while ((node = xpathresult.snapshotItem(index++)))
            nodes.push(node);
        return nodes;
    },
    
    _nodeValue: function(parent, name, xpath) {
        if (!parent) { return ''; }
        var node = xpath ? this.select(name, parent)[0] : parent.getElementsByTagName(name)[0];
        return node && node.firstChild && node.firstChild.nodeValue || '';
    },
    
    _sanitizeName: function(name) {
        return (name || '').replace(/\s+/g, '').replace(',', '').replace(/\./g, '');
    },
    
    _sanitizeDescription: function(name) {
        return (name || '').replace(/<\/?[^>]+(>|$)/g, "");
    },
    
    error: function(msg) {
        console.error(msg);
    },
    
    notCompatible: function() {
        return !('evaluate' in document) && !('localStorage' in window);
    }
};