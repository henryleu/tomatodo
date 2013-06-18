app_dir = /usr/apps/tomatodo  
tar_dir = /usr/apps  

install:
    git archive --format=tar master | gzip > $(tar_dir)/tomatodo.tar.gz  
    tar xf $(tar_dir)/tomatodo.tar.gz $(app_dir)  
    sudo cp ./tomatodo.conf /etc/event.d/tomatodo  
    cd $(app_dir)
    sudo npm install

deploy:  
    sudo rm -Rf $(app_dir)  
    sudo mkdir $(app_dir)   
    sudo make install  
    sudo make start_app  

start_app:  
    sudo start --no-wait -q tomatodo
