/**
 * Created by jangjin-yeong on 2017. 2. 12..
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var pool = mysql.createPool({
    connectionLimit: 10, //important
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'delivery_mate',
    debug: false
});

function getMatch(req, res, next) {
    var user_id = req.query.user_id;
    var matchList = [];
    pool.query('SELECT o.id as order_id, o.status as status, o.store_id as store_id, o.main_menu_id as main_menu_id, ' +
                'o.expire_time as expire_time, s.name as store_name, m.name as main_menu_name '+
                'FROM orders o JOIN stores s ON o.store_id = s.id ' +
                              'JOIN menu m ON o.main_menu_id = m.id ' +
                'WHERE o.user_id = ? '+
                'ORDER BY o.status ASC', [user_id], function (err, rows) {
        if (!err) {
            rows.forEach(function (row) {
                var item = {
                    'order_id' : row.order_id,
                    'status' : row.status,
                    'store_id' : row.store_id,
                    'main_menu_id' : row.main_menu_id,
                    'expire_time' : row.expire_time,
                    'store_name' : row.store_name,
                    'main_menu_name' : row.main_menu_name
                };
                matchList.push(item);
            });
            res.json(matchList);
            console.log(matchList);
        } else {
            res.json({"message": "fail"});
            console.log('Error while performing Query.', err);
        }
    });
}

router.get('/', getMatch);
module.exports = router;
