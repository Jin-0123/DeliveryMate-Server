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

function addUser(req, res, next) {
    var uid = req.body.uid;
    var dong_code = req.body.dong_code;
    var pushid = req.body.push_id;
    var last_simple_address = req.body.last_simple_address;
    var address = req.body.address;
    console.log(uid, " ", dong_code, " ", pushid, " ", last_simple_address, " ", address);
    pool.query('INSERT INTO users (u_id, dong_code, push_id, last_simple_address, address) ' +
                'VALUES (?,?,?,?,?)', [uid, dong_code, pushid, last_simple_address, address],
        function (err, rows) {
        if (!err) {
            res.json({"user_id": rows.insertId});
        } else {
            res.json({"message": "fail"});
            console.log('Error while performing Query.', err);
        }
    });
}

function updateUser(req, res, next) {
    var id = req.body.id;
    var dong_code = req.body.dong_code;
    var pushid = req.body.push_id;
    var last_simple_address = req.body.last_simple_address;
    var address = req.body.address;

    var columns = ["dong_code", "push_id", "last_simple_address", "address"];
    var values = [dong_code, pushid, last_simple_address, address];

    var setQuery = "";
    var settedIdx = 0;
    console.log(values);
    console.log(columns);
    for (var i = 0; i < values.length; i++) {

        if (values[i] != undefined) {
            if (settedIdx > 0) {
                setQuery += (", ");
            }
            setQuery += (columns[i]);
            setQuery += (" = ");
            setQuery += (" '");
            setQuery += (values[i]);
            setQuery += ("'");
            settedIdx++;
        }
    }

    pool.query('UPDATE users '+
                ' SET ' + setQuery + ' '+
                'WHERE id=?', [id], function (err, rows) {
        if (!err) {
            res.json({"message": "success"});
            console.log(rows)
        } else {
            res.json({"message": "fail"});
            console.log('Error while performing Query.', err);
        }
    });
}

function getUser(req, res, next) {
    var uid = req.body.uid;
    var dong_code = req.body.dong_code;
    var pushid = req.body.push_id;
    var last_simple_address = req.body.last_simple_address;
    var address = req.body.address;

    waterfall([
            function(callback){
            var result = ""
                pool.query('SELECT id ' +
                            'FROM users ' +
                            'WHERE u_id=?', [uid], function (err, rows)  {
                        if (!err) {
                            if (rows != "")  {
                                result =  rows[0].id

                            } else {
                                result = "insert"
                            }
                            callback(null, pool, result);

                        } else {
                            res.json({"message": "fail"});
                            console.log('Error while performing Query.', err);
                        }
                    });

            },

            function(pool, result, callback) {
                if (result == "insert" && uid != undefined){
                    pool.query('INSERT INTO users (u_id, dong_code, push_id, last_simple_address, address) ' +
                            'VALUES (?,?,?,?,?)', [uid, dong_code, pushid, last_simple_address, address],
                        function (err, rows) {
                            if (!err) {
                                result = {"user_id": rows.insertId};
                                callback(null, result);
                            } else {
                                res.json({"message": "fail"});
                                console.log('Error while performing Query.', err);
                            }
                        });
                } else {
                    if (dong_code != undefined || pushid != undefined || last_simple_address != undefined || address != undefined) {
                        var columns = ["dong_code", "push_id", "last_simple_address", "address"];
                        var values = [dong_code, pushid, last_simple_address, address];

                        var setQuery = "";
                        var settedIdx = 0;
                        console.log(values);
                        console.log(columns);
                        for (var i = 0; i < values.length; i++) {

                            if (values[i] != undefined) {
                                if (settedIdx > 0) {
                                    setQuery += (", ");
                                }
                                setQuery += (columns[i]);
                                setQuery += (" = ");
                                setQuery += (" '");
                                setQuery += (values[i]);
                                setQuery += ("'");
                                settedIdx++;
                            }
                        }

                        pool.query('UPDATE users ' +
                            ' SET ' + setQuery + ' ' +
                            'WHERE id=?', [result], function (err, rows) {
                            if (!err) {
                                result = {"user_id" : result};
                                callback(null, result);
                                console.log(rows)
                            } else {
                                res.json({"message": "fail"});
                                console.log('Error while performing Query.', err);
                            }
                        });
                    } else {
                        console.log(result)
                        result = {"user_id" : result};
                        callback(null, result);
                    }
                }
            }],

        function(err, result){
            if(!err) {
                res.json(result);
                console.log(result);
            } else {
                res.json(result);
                console.log("err: "+err);
            }
        }
    );
}

function getUserAddress(req, res, next) {
    var id = req.query.id;
    pool.query('SELECT last_simple_address ' +
        'FROM users ' +
        'WHERE id=?', [id], function (err, rows) {
        if (!err) {
            res.json({"last_simple_address": rows[0].last_simple_address});
        } else {
            res.json({"message": "fail"});
            console.log('Error while performing Query.', err);
        }
    });
}

router.post('/', getUser)
router.post('/add', addUser);
router.put('/update', updateUser);
router.get('/address', getUserAddress);

module.exports = router;
