/**
 * Created by jangjin-yeong on 2017. 2. 12..
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'delivery_mate',
    debug: false
});

function getCategories(req, res, next) {
    var categories = [];
    pool.query('SELECT id, name ' +
                'FROM categories', function (err, rows) {
        if (!err) {
            rows.forEach(function (row) {
                var category = {
                    'id' : row.id,
                    'name' : row.name
                };
                categories.push(category);
            });
            res.json(categories);
            console.log(categories);
        } else {
            res.json({"message": "fail"});
            console.log('Error while performing Query.', err);
        }
    });
}

router.get('/', getCategories);

module.exports = router;
