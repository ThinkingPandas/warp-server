var _ = require('underscore');

module.exports = {
    find: function(req, res, next) {
        var className = req.params.className;
        var options = {
            select: req.query.select? JSON.parse(req.query.select) : {},
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.order? JSON.parse(req.query.order) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0
        };
        
        // Remove all deleted migrations
        options.where.deleted_at = {
            'ex': false
        };
        
        var query = new this.Query.View(this.Migration.className);
                
        // View objects
        query.select({
            'id': 'id',
            'up': 'up',
            'down': 'down',
            'commited_at': 'commited_at',
            'created_at': 'created_at',
            'updated_at': 'updated_at'
        })
        .where(options.where)
        .sort(options.sort)
        .limit(options.limit)
        .skip(options.skip)
        .find(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    first: function(req, res, next) {
        var className = req.params.className;
        var id = req.params.id;
        
        // View object
        var query = new this.Query.View(this.Migration.className);
                
        // View objects
        query.select({
            'id': 'id',
            'up': 'up',
            'down': 'down',
            'commited_at': 'commited_at',
            'created_at': 'created_at',
            'updated_at': 'updated_at'
        })
        .where({
            'id': {
                'eq': id
            },
            'deleted_at': {
                'ex': false
            }
        })
        .first(function(result) 
        {        
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err) 
        {
            next(err);
        });
    },
    create: function(req, res, next) {
        var options = _.extend({}, req.body);
        var migration = new this.Migration(options);
        
        // Create object
        migration.create().then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    update: function(req, res, next) {
        var options = _.extend({}, req.body);
        var id = req.params.id;
        options.id = id;
        var migration = new this.Migration(options);
        
        // Update object
        migration.update().then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    destroy: function(req, res, next) {
        var id = req.params.id;
        var migration = new this.Migration({ id: id });
        
        // Delete object
        migration.destroy().then((function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    apply: function(context, router) {
        router.get('/migrations', this.find.bind(context));
        router.get('/migrations/:id', this.first.bind(context));
        router.post('/migrations', this.create.bind(context));
        router.put('/migrations/:id', this.update.bind(context));
        router.delete('/migrations/:id', this.destroy.bind(context));
        return router;
    }
};