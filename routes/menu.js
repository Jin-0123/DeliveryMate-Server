/**
 * Created by jangjin-yeong on 2017. 2. 12..
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var pool = mysql.createPool({
});

function getMenu(req, res, next) {
    var store_id = req.query.store_id;
    var menu = [];
    pool.query(' SELECT id, name, price, type, require_people_num '+
                'FROM menu ' +
                'WHERE store_id=?', [store_id], function (err, rows) {
            if (!err) {
                rows.forEach(function (row) {
                    var item = {
                        'id' : row.id,
                        'name' : row.name,
                        'price' : row.price,
                        'type' : row.type,
                        'require_people_num' : row.require_people_num
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
