/**
 * Created by Nicholas_Wang on 2016/4/15.
 */
var express = require('express');
var ejs = require('ejs');
var path = require('path');
var app = express();

app.set('views', __dirname);
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    console.log('weChat wall connected');
    res.render('index');
});

app.listen(9530, function (req, res) {
    console.log('wall running at 9530');
});