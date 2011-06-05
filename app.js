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
        if (!(d instanceof Date)) {
          d = d.split('-');
          d = new Date(d[0], (d[1] - 1), d[2]);
          }
        var added = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
        this.set({added: added});
      }
    });

    // Views

    var AppView = Backbone.View.extend({

      el: $('#app'),

      events: {
        'click #submit-button': 'submit'
      },

      initialize: function() {
        _.bindAll(this, 'addAll', 'addOne', 'render');

        this.entries = new EntryList;
        this.entries.bind('add', this.addOne);
        this.entries.bind('refresh', this.addAll);
        this.entries.bind('all', this.render);

        this.entries.fetch();

        this.description = this.$('#entry-form .desc input');
        this.amount = this.$('#entry-form .amount input');
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
      },

      submit: function() {
        // create a new model, add it to the collection
        var e = new Entry({
          description: this.description.val(),
          amount: parseFloat(this.amount.val(), 10),
          date: new Date
        });
        // add it to the collection
        this.entries.add(e);
        // clear the form
        this.description.val('');
        this.amount.val('');
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
        return Math.round(t*100) / 100;
      }
    });

    // Start the engines

    var app = new AppView;

  });

})(jQuery);
