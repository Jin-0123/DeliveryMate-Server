/**
 * Created by jangjin-yeong on 2017. 2. 12..
 */
var express = require('express');
var mysql = require('mysql');
var waterfall = require("async/waterfall");
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

    pool.query('SELECT o.id AS order_id, s.id AS store_id, m.id AS main_menu_id, o.status AS status, o.total_price AS total_price, ' +
                's.name AS store_name, m.name AS main_menu_name, m.price AS main_menu_price, ' +
                'm.image_url AS main_menu_image_url, m.require_people_num AS require_people_num ' +
                'FROM orders o JOIN stores s ON o.store_id = s.id ' +
                            'JOIN menu m ON o.main_menu_id = m.id ' +
                'WHERE o.user_id = ? '+
                'ORDER BY o.expire_time DESC ', [user_id], function (err, rows) {
        if (!err) {
            rows.forEach(function (row) {
                var item = {
                    'message' : 'success',
                    'order_id' : row.order_id,
                    'store_id' : row.store_id,
                    'main_menu_id' : row.main_menu_id,
                    'status' : row.status,
                    'store_name' : row.store_name,
                    'main_menu_name' : row.main_menu_name,
                    'main_menu_price' : row.main_menu_price,
                    'require_people_num' : row.require_people_num,
                    'main_menu_image_url' : row.main_menu_image_url,
                    'total_price' : row.total_price
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
    var store_id = req.query.store_id;
    var main_menu_id = req.query.main_menu_id;
    var extraList = [];
    waterfall([
        function(callback){
            pool.query('SELECT m.id AS extra_id, name AS extra_name, count AS extra_count, price AS extra_price '+ 
                    'FROM ordered_menu om JOIN menu m ON om.menu_id = m.id '+ 
                    'WHERE om.order_id = ? AND m.type = "extra"', [order_id], 
                function (err, rows) {
                    if (!err) {
                        if (rows.length != 0) {
                            var extraList = [];
                            rows.forEach(function (row) {
                                var extraItem = {
                                    'extra_id' : row.extra_id,
                                    'extra_menu_name': row.extra_name,
                                    'extra_menu_count': row.extra_count,
                                    'extra_menu_price': row.extra_price
                                };
                                extraList.push(extraItem);
                                console.log(extraList)
                            });
                            callback(null, pool, order_id, extraList);
                        } else {
                            res.json({'message' : 'success'})
                        }
                    } else {
                        res.json({'message': 'fail'});
                    }
                });
        },

        function(pool, order_id, extraList, callback) {
                var result;
                // 1. 지금 등록한 주문을 제외한 매칭가능한 주문 수 조회
                pool.query('SELECT o.id as matchOrders, o.user_id as user_id, m.require_people_num as require_people_num '+
                    'FROM orders o JOIN menu m ON o.main_menu_id = m.id '+
                    'WHERE o.status="waiting" AND o.store_id=? AND o.main_menu_id=? AND o.id!=? '+
                    'ORDER BY o.expire_time DESC ',
                    [store_id, main_menu_id, order_id],
                    function (err, rows) {
                        if (!err) {
                            console.log(rows.length+" "+rows);
                            // 2. 현재 주문 수보다 충족 수가 작을 경우 처리
                            if (rows.length == 0) {
                                result = {
                                    'message':'success',
                                    'status': 'waiting',
                                    'current_people_num': 1,
                                    'extra_menu' : extraList
                                };
                            }
                            else if ( (rows.length + 1) < rows[0].require_people_num ) {
                                console.log(rows.length + 1)
                                result = {
                                    'message':'success',
                                    'status': 'waiting',
                                    'current_people_num': rows.length + 1,
                                    'extra_menu' : extraList
                                };
                            }
                            // 3. 현재 주문 수가 충족 수를 만족했을 때 처리
                            else {
                                result = {
                                    'message':'success',
                                    'status' : 'match',
                                    'current_people_num': rows.length,
                                    'extra_menu' : extraList
                                };
                            }
                            callback(null, result);
                        } else {
                            res.json({'message': 'fail'});
                            console.log('Error while performing Query.', err);
                        }
                    });
        }],
        function(err, result){
            if(err) {
                console.log("err: "+err);
            } else {
                console.log(result);
                res.json(result);
            }
        }
    );
}
router.get('/', getMatch);
router.get('/extra', getExtraManus);

module.exports = router;
