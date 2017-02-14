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


function getStores(req, res, next) {
    var category_id = req.query.category_id;
    var dong_code = req.query.dong_code;
    var stores = [];
    pool.query('SELECT s.id, s.name, s.image_url '+
                'FROM stores s JOIN delivery_zones d ON s.id = d.store_id ' +
                'WHERE s.category_id = ? AND (d.dong_code LIKE ? OR d.dong_code = ?)',
                [category_id, dong_code.substr(0,5)+'%', dong_code], function (err, rows) {
        if (!err) {
            rows.forEach(function (row) {

                var store = {
                    'id' : row.id,
                    'name' : row.name,
                    'image_url' : row.url
                };
                stores.push(store);
            });
            res.json(stores);
            console.log(stores);
        } else {
            res.json({"message": "fail"});
            console.log('Error while performing Query.', err);
        }
    });
}

router.get('/', getStores);

module.exports = router;

