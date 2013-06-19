app_dir = /usr/local/apps/tomatodo/
tar_dir = /usr/local/apps/

deploy:
	$(warning remove appdir)
	sudo rm -Rf $(app_dir)
	$(warning create appdir)
	sudo mkdir $(app_dir)
	$(warning git archive)
	sudo rm -f $(tar_dir)tomatodo.tar.gz
	sudo git archive --format=tar master | gzip > $(tar_dir)tomatodo.tar.gz
	$(warning tar extract package)
	tar -xf $(tar_dir)tomatodo.tar.gz -C $(app_dir)
	$(warning create log folder)
	sudo mkdir $(app_dir)logs

