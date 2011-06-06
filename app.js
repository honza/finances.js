// Finances
// ========
//
// Finances is a small, proof-of-concept application to show off some of the
// cool functionality that [Backbone.js](http://documentcloud.github.com/backbone/)
// can provide. The code is freely distributable under the terms of the BSD
// license.


(function($) {

  // the classic jQuery `documentready` function
  $(function() {

    // Models
    // ------

    // The `Entry` model is a data structure to represent one row in the table.
    // It has the following attributes:
    //
    //     {
    //       "description": "Coffee at JustUs",
    //       "amount": 2.99
    //       "date": new Date
    //     }
    //
    // This will be automatically serialized to a JSON object when saving the
    // object to the database, so bear that in mind.

    var Entry = Backbone.Model.extend({
      initialize: function() {
        // In addition to our model's `date` attribute, we'll add a
        // human-readable representation of the date when the model is created
        var d = new Date(this.get('date'));
        var dateString = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
        this.set({
          humanDate: dateString
        });
      }
    });

    // Views
    // -----

    // `AppView` is the top-level piece of UI. This view will hold a collection
    // of `Entry` instances and will receive and handle global events.

    var AppView = Backbone.View.extend({

      // The pre-existing DOM element to which we'll bind.

      el: $('#app'),

      events: {
        'click #submit-button': 'submit'
      },

      // `AppView` constructor

      initialize: function() {
        // `bindAll()` is an Underscore.js utility that allows you to keep the
        // correct `this` in a callback function. In this case, the methods
        // `addAll`, `addOne` and `render` will receive the `AppView` instance
        // as `this`.

        _.bindAll(this, 'addAll', 'addOne', 'render');

        // Create an instance of the `EntryList` collection and bind its events
        // to `AppView` methods.

        this.entries = new EntryList;
        this.entries.bind('add', this.addOne);
        this.entries.bind('refresh', this.addAll);
        this.entries.bind('all', this.render);

        // Ask the database (server, localStorage or otherwise) for entries
        this.entries.fetch();

        // Store references to some important DOM elements. Note that the
        // `this.$()` is a regular jQuery selector function which executes in
        // the context of the view's `el`.

        this.description = this.$('#entry-form .desc input');
        this.amount = this.$('#entry-form .amount input');
      },

      addAll: function() {
        this.entries.each(this.addOne);
      },

      addOne: function(entry) {
        // Given a model object from the database, create its view, render the
        // view and and add it to the DOM.

        var view = new EntryView({model: entry});
        this.$('#entries').append(view.render().el);
      },

      render: function() {
        // The `render` function is called when any event on the collection is
        // triggered. This causes the total to be updated. Here we ask the
        // collection for the total amount and update the UI.

        var total = this.entries.getTotal();
        this.$('#total .amount').html('$ ' + total);
      },

      submit: function() {
        // `Submit` is called when a new entry is being submitted. Here we
        // create a new model instance and add it to the collection. Note that
        // the collection itself will notice that someting has change and fire
        // the appropriate events to handle the UI update.

        this.entries.create({
          description: this.description.val(),
          amount: parseFloat(this.amount.val(), 10),
          date: new Date
        });
        // Clear the form
        this.description.val('');
        this.amount.val('');
      }

    });

    // `EntryView` is a view that describes how an `Entry` model is to be
    // displayed. It also does some event handling. All logic that is related
    // to the `Entry` instance that has to do with the UI should be in the
    // view.

    var EntryView = Backbone.View.extend({

      // Underscore.js template. The template is present in the DOM on page
      // load, so we look it up and store its contents in memory.

      template: _.template($('#entry-template').html()),

      // Here we define all the events and their handlers that this piece of UI
      // understands.

      events: {
        'click input.delete': 'deleteEntry',
        'focus span.amount': 'amountFocus',
        'blur span.amount': 'amountBlur',
        'focus span.desc': 'descFocus',
        'blur span.desc': 'descBlur'
      },

      // Constructor function. Again, we bind the correct `this` in the
      // `render` function. Also, anytime the underlying model changes, we
      // re-render the view to keep it up-to-date.

      initialize: function() {
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
        this.model.view = this;
      },

      // Delete entry from both UI and from the database.

      deleteEntry: function() {
        this.model.destroy();
        this.remove();
      },

      // Rendering is done via Underscore.js templating. The model is converted
      // to JSON and passed as context to the templating function. We return
      // `this` to allow chaining.

      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      },

      // the `...Focus` and `...Blur` functions are handlers for
      // contenteditable elements. When you start editing an element, we store
      // its original state. Once you are done editing it, the blur event is
      // fired - we check the contents and see if they were changed. If so, we
      // update the model which triggers all kinds of activity. The model's
      // view is updated, the model is update in the dabatase and the total
      // amount field is updated. We do this for both the `description` and
      // `amount` fields.

      amountFocus: function() {
        this.amountBefore = this.$('span.amount').text();
      },

      amountBlur: function() {
        var now = this.$('span.amount').text();
        if (this.amountBefore != now) {
          now = parseFloat(now, 10);
          this.model.set({amount: now});
          this.model.save();
        }
      },

      descFocus: function() {
          this.descBefore = this.$('span.desc').text();
      },

      descBlur: function() {
        var now = this.$('span.desc').text();
        if (this.descBefore != now) {
          this.model.set({
            description: now
          });
          this.model.save();
        }
      }

    });

    // Collections
    // -----------

    // The `EntryList` collection holds the individual entries and allows you
    // to perform queries and other common operations on the list. Also,
    // instead of a server, we're using localStorage to persist the data. This
    // is done under the `finances` namespace.

    var EntryList = Backbone.Collection.extend({
      model: Entry,
      localStorage: new Store('finances'),

      getTotal: function() {
        // Here we loop through all the entries in the collection and add all
        // the amounts together to produce a total.
        var t = 0;
        this.each(function(item) {
          t += item.get('amount');
        });
        // And round it to 2 decimals.
        return Math.round(t*100) / 100;
      }
    });

    // Start the engines
    // -----------------

    var app = new AppView;

  });

})(jQuery);
