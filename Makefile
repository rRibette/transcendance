NAME = transcendence

DC_YAML = docker-compose.yml
DC = docker compose -f $(DC_YAML)

all:
# 	mkdir -p $(DIR)
# 	@echo "Created MyDir directory for volumes"
	docker compose -f $(DC_YAML) up -d --build
	@echo "Successfully created container"

down:
	$(DC) down

clean: 
	$(DC) down --rmi all

fclean:
	$(DC) down --rmi all --volumes
	docker system prune -af 
	docker volume prune -f 

re: clean all

fre: fclean all

.PHONY: all clean fclean re
