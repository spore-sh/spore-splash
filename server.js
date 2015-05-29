var express = require('express'),
    app = express(),
    path = require('path');

app.use('/assets', express.static(path.resolve(__dirname, 'public')));

app.set('views', './views');
app.set('view engine', 'jade');

app.get('/', function (req, res, next) {
  res.render('index', { index: true });
});

app.get('/how-it-works', function (req, res, next) {
  res.render('index', { howItWorks: true });
});

app.get('/collaboration', function (req, res, next) {
  res.render('index', { collaboration: true });
});

app.listen(process.env.PORT || 3111);