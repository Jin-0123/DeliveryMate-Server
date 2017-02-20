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

function getMatch(req, res, next) {
    var user_id = req.query.user_id;
    var matchList = [];

    pool.query('SELECT o.id AS order_id, o.status AS status, s.name AS store_name, m.name AS main_menu_name ' +
                'FROM orders o JOIN stores s ON o.store_id = s.id ' +
                            'JOIN menu m ON o.main_menu_id = m.id ' +
                'WHERE o.user_id = ? '+
                'ORDER BY o.status ASC ', [user_id], function (err, rows) {
        if (!err) {
            rows.forEach(function (row) {
                var item = {
                    'message' : 'success',
                    'order_id' : row.order_id,
                    'status' : row.status,
                    'store_name' : row.store_name,
                    'main_menu_name' : row.main_menu_name
                };
                matchList.push(item)
            });
            res.json(matchList)
        } else {
            res.json({'message': 'fail'});
            console.log('Error while performing Query.', err);
        }
    });
}

function getExtraManus(req, res, next) {
    var order_id = req.query.order_id;
    var extraList = [];
    pool.query('SELECT name AS extra_name, count AS extra_count, price AS extra_price '+ 
                'FROM ordered_menu om JOIN menu m ON om.menu_id = m.id '+ 
                'WHERE om.order_id = ? AND m.type = "extra"', [order_id], 
                function (err, rows) {
                    if (!err) {
                        if (rows.length != 0) {
                            var extraList = [];
                            rows.forEach(function (row) {
                                var extraItem = {
                                    'message' : 'success',
                                    'extra_menu_name': row.extra_name,
                                    'extra_menu_count': row.extra_count,
                                    'extra_menu_price': row.extra_price
                                };
                                extraList.push(extraItem);
                                console.log(extraList)
                            });
                            res.json(extraList)
                        } else {
                            res.json({'message' : 'noRow'})
                        }
                    } else {
                        res.json({'message': 'fail'});
                    }
                });
        return extraList
}
router.get('/', getMatch);
router.get('/extra', getExtraManus);

module.exports = router;
