app_dir = /usr/local/apps/tomatodo/
tar_dir = /usr/local/apps/

deploy:
	$(warning stop tomatodo service)
	#sudo service tomatodo stop
	$(warning remove appdir)
	sudo rm -Rf $(app_dir)
	$(warning create appdir)
	sudo mkdir $(app_dir)
	sudo make install
	sudo make start_app

install:
	$(warning install app)
	$(warning git archive)
	git archive --format=tar master | gzip > $(tar_dir)tomatodo.tar.gz
	$(warning tar extract package)
	tar -xf $(tar_dir)tomatodo.tar.gz -C $(app_dir)
	$(warning npm install)
	cd $(app_dir)
	sudo npm update
	sudo mkdir $(app_dir)logs

start_app:
	$(warning start tomatodo service)
	#sudo service tomatodo start

