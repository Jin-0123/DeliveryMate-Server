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

function getMenu(req, res, next) {
    var store_id = req.query.store_id;
    var menu = [];
    pool.query(' SELECT id, name, price, type, require_people_num, image_url, main_count, extra_count '+
                ' FROM (SELECT id, name, price, type, require_people_num, image_url FROM menu WHERE store_id = ?) as menu, '+
                    '(SELECT count(id) as main_count FROM menu WHERE store_id = ? AND type="main") as main, '+
                    '(SELECT count(id) as extra_count FROM menu WHERE store_id = ? AND type="extra") as extra '
            , [store_id, store_id, store_id], function (err, rows) {
            if (!err) {
                rows.forEach(function (row) {
                    var item = {
                        'id' : row.id,
                        'name' : row.name,
                        'price' : row.price,
                        'type' : row.type,
                        'require_people_num' : row.require_people_num,
                        'main_count' : row.main_count,
                        'extra_count' : row.extra_count
                    };
                    menu.push(item);
                });
                res.json(menu);
                console.log(menu);
            } else {
                res.json({"message": "fail"});
                console.log('Error while performing Query.', err);
            }
        });
}


router.get('/', getMenu);
module.exports = router;
