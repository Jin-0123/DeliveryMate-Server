/**
 * Created by jangjin-yeong on 2017. 2. 12..
 */
var express = require('express');
var mysql = require('mysql');
var waterfall = require("async/waterfall");
var router = express.Router();

var pool = mysql.createPool({
    connectionLimit: 10, //important
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'delivery_mate',
    debug: false
});


function registerOrder(req, res, next) {
    var user_id = req.body.user_id;
    var store_id = req.body.store_id;
    var main_menu_id = req.body.main_menu_id;
    var extra_menu = req.body.extra_menu;
    var total_price = req.body.total_price;

    waterfall([
        function(callback){
            var expire_time = req.body.expire_time;
            pool.query('INSERT INTO orders (user_id, store_id, main_menu_id, total_price, status, expire_time) '+
                        'VALUES (?,?,?,?,?,now())', [user_id, store_id, main_menu_id, total_price, "waiting"],
                function (err, rows) {
                    if (!err) {
                        callback(null, pool, rows.insertId);

                    } else {
                        res.json({'message': 'fail'});
                        console.log('Error while performing Query.', err);
                    }
                });

        },

        function(pool, order_id, callback) {
            var valueQuery = "";
            var valueIdx = 1;

            // 1. main menu Insert query 만들기
            valueQuery += "(";
            valueQuery += order_id;
            valueQuery += ",";
            valueQuery += main_menu_id;
            valueQuery += ",";
            valueQuery += 1;
            valueQuery += ")";

            // 2. extra meny Insert query 만들기
            extra_menu.forEach(function (item) {
                if (valueIdx > 0) {
                    valueQuery += ",";
                }
                valueQuery += "(";
                valueQuery += order_id;
                valueQuery += ",";
                valueQuery += item.menu_id;
                valueQuery += ",";
                valueQuery += item.menu_count;
                valueQuery += ")";
            });

            pool.query('INSERT INTO ordered_menu (order_id, menu_id, count) ' + 'VALUES ' + valueQuery,
                function (err, rows) {
                    if (!err) {
                        callback(null, pool, order_id);
                    } else {
                        res.json({'message': 'fail'});
                        console.log('Error while performing Query.', err);
                    }
                });
        },

        function(pool, order_id, callback) {
            var result;
            // 1. 지금 등록한 주문을 제외한 매칭가능한 주문 수 조회
            pool.query('SELECT o.id as matchOrders, o.user_id as user_id, m.require_people_num as require_people_num '+
                        'FROM orders o JOIN menu m ON o.main_menu_id = m.id '+
                        'WHERE o.status="waiting" AND o.store_id=? AND o.main_menu_id=? AND o.id!=? '+
                        'ORDER BY o.expire_time ASC ',
                        [store_id, main_menu_id, order_id],
                function (err, rows) {
                    if (!err) {
                        console.log(rows.length+" "+rows);
                        // 2. 현재 주문 수보다 충족 수가 작을 경우 처리
                        if (rows.length == 0) {
                            result = {
				                'message':'success',
                                'status': 'waiting',
                                'current_people_num': 1
                            };
                        }
                        else if ( (rows.length + 1) < rows[0].require_people_num ) {
                            result = {
				                'message':'success',
                                'status': 'waiting',
                                'current_people_num': rows.length + 1
                            };
                        }
                        // 3. 현재 주문 수가 충족 수를 만족했을 때 처리
                        else {
                            var matchOrder = "";
                            var matchPuchUser = [];

                            matchOrder += "("+order_id;
                            for(var i = 0; i < rows.length; i++) {
                                matchOrder += ","+rows[i].matchOrders;
                                matchPuchUser += rows[i].user_id;
                            }
                            matchOrder += ")";

                            result = {
				                'message':'success',
                                'status' : 'match',
                                'current_people_num': rows.length,
                                'match_order_id' : matchOrder,
                                'match_push_user_id' : matchPuchUser
                            };
                        }
                        callback(null, pool, result);
                    } else {
                        res.json({"message": "fail"});
                        console.log('Error while performing Query.', err);
                    }
                });
        },

        function(pool, result, callback){
            if (result.status == "waiting") {
                callback(null, result);
            } else {
                pool.query('UPDATE orders '+
                            'SET status = "match" '+
                            'WHERE id IN '+ result.match_order_id,
                    function (err, rows) {
                        if (!err) {
                            // result[].user_id에 해당하는 pushid에 푸쉬보내줄것
                            callback(null, result);
                        } else {
                            res.json({'message': 'fail'});
                            console.log('Error while performing Query.', err);
                        }
                });
            }
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

router.post('/', registerOrder);
module.exports = router;
