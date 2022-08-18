var Constant = require('../constant')

var BaseRouter = require('./base.router')

var path = require('path');


class IndexRouter extends BaseRouter{

	additionalController(){
		this.router.get('/', function(req, res, next) {
			res.render('index_with_data' , {} ,function(err) {
				if (err) {
					res.status(500).send(err)
				}
			});
			// res.sendFile(path.join(Constant.rootFolder, 'public/index.html'), function(err) {
			// 	if (err) {
			// 		res.status(500).send(err)
			// 	}
			// })
		});

		this.router.get('/.well-known/apple-app-site-association', function(req, res, next) {
			res.render('index_with_data' , {} ,function(err) {
				if (err) {
					res.status(500).send(err)
				}
			});
			// res.sendFile(path.join(Constant.rootFolder, 'public/index.html'), function(err) {
			// 	if (err) {
			// 		res.status(500).send(err)
			// 	}
			// })
		});
		
	}
	
}

module.exports = IndexRouter;
