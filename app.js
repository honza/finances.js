//  Finances
//  (c) 2011 - Honza Pokorny
//  3-clause BSD licensed
//  http://

(function($) {


  $(function() {

    // Models

    var Entry = Backbone.Model.extend({
      initialize: function() {
        // parse date
        var d = this.get('date');
        d = d.split('-');
        d = new Date(d[0], d[1], d[2]);
        var added = d.getMonth() + '/' + d.getDate() + '/' + d.getFullYear();
        this.set({added: added});
      }
    });

    // Views

    var AppView = Backbone.View.extend({

      el: $('#app'),

      initialize: function() {
        _.bindAll(this, 'addAll', 'addOne', 'render');

        this.entries = new EntryList;
        this.entries.bind('add', this.addOne);
        this.entries.bind('refresh', this.addAll);
        this.entries.bind('all', this.render);

        this.entries.fetch();
      },

      addAll: function() {
        this.entries.each(this.addOne);
      },

      addOne: function(entry) {
        var view = new EntryView({model: entry});
        this.$('#entries').append(view.render().el);
      },

      render: function() {
        // add up all the amounts
        var total = this.entries.getTotal();
        this.$('#total .amount').html('$ ' + total);
      }

    });

    var EntryView = Backbone.View.extend({

      template: _.template($('#entry-template').html()),

      events: {
        'click a': 'clicked'
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
        this.model.view = this;
      },

      clicked: function() {
      },

      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      }

    });

    // Collections

    var EntryList = Backbone.Collection.extend({
      model: Entry,
      url: '/data/finances.json',

      // add up all the amounts for all entries
      getTotal: function() {
        var t = 0;
        this.each(function(item) {
          t += item.get('amount');
        });
        return t;
      }
    });

    // Start the engines

    var app = new AppView;

  });

})(jQuery);
