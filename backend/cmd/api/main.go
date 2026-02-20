package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"youwont.api/internal/handler"
	"youwont.api/internal/repository"
	"youwont.api/internal/service"

	"github.com/labstack/echo/v5"
	//"github.com/labstack/echo/v5/middleware"
)

func main() {
    client := connectMongo()
	testDb := client.Database("youwont")
    //prodDb := client.Database("prodyouwont")


    repo := repository.NewRepository(testDb)
    service := service.NewService(repo)
    handler := handler.NewHandler(service)

    e := echo.New()
    e.POST("/users", handler.CreateUser)

    e.Start(":8080")
}

func connectMongo() *mongo.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	content, err := os.ReadFile("../../secrets/mongodb_password.txt")
	if err != nil {
		log.Fatal(err)
	}
	password := strings.TrimSpace(string(content))
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb+srv://gmosspaul18_db_user:"+password+"@cluster0.zb1wfdn.mongodb.net/youwont?retryWrites=true&w=majority"))
	if err != nil {
		panic(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		panic(err)
	}

	return client
}